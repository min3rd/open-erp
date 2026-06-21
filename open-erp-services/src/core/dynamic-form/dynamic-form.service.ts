import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DynamicForm } from './entities/dynamic-form.entity';

// ─── Field types supported ────────────────────────────────────────────────────
const SUPPORTED_FIELD_TYPES = ['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX', 'FILE'];

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable()
export class DynamicFormService {
  constructor(
    @InjectRepository(DynamicForm)
    private readonly formRepository: Repository<DynamicForm>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Create or update (new version) ────────────────────────────────────────
  async createOrUpdateForm(
    tenantId: string | null,
    dto: {
      formKey: string;
      name: string;
      description?: string;
      fields: any[];
    },
  ): Promise<DynamicForm> {
    const { formKey, name, description, fields } = dto;

    if (!formKey || !formKey.trim()) {
      throw new BadRequestException('formKey là bắt buộc (formKey is required)');
    }
    if (!name || !name.trim()) {
      throw new BadRequestException('name là bắt buộc (name is required)');
    }
    if (!fields || !Array.isArray(fields)) {
      throw new BadRequestException('fields phải là mảng (fields must be an array)');
    }

    // Validate each field schema
    this.validateFieldSchemas(fields);

    return this.dataSource.transaction(async (manager) => {
      // Find existing latest version for the same formKey + tenant
      const existing = await manager.findOne(DynamicForm, {
        where: { formKey, tenantId: tenantId as any, isLatest: true },
      });

      const nextVersion = existing ? existing.version + 1 : 1;

      // Mark old latest as no longer latest
      if (existing) {
        existing.isLatest = false;
        await manager.save(DynamicForm, existing);
      }

      // Create new version
      const newForm = new DynamicForm();
      newForm.tenantId = tenantId;
      newForm.formKey = formKey.trim();
      newForm.name = name.trim();
      newForm.description = description?.trim() || null;
      newForm.version = nextVersion;
      newForm.isLatest = true;
      newForm.fields = fields;

      return manager.save(DynamicForm, newForm);
    });
  }

  // ── Get all versions of a form by formKey ─────────────────────────────────
  async getVersionsByKey(formKey: string, tenantId: string | null): Promise<DynamicForm[]> {
    const forms = await this.formRepository.find({
      where: { formKey, tenantId: tenantId as any },
      order: { version: 'DESC' },
    });

    if (forms.length === 0) {
      throw new NotFoundException(`Form với formKey "${formKey}" không tồn tại`);
    }

    return forms;
  }

  // ── Restore a specific version (clone it as new latest) ───────────────────
  async restoreVersion(id: string, tenantId: string | null): Promise<DynamicForm> {
    const targetForm = await this.formRepository.findOne({
      where: { id, tenantId: tenantId as any },
    });

    if (!targetForm) {
      throw new NotFoundException(`Phiên bản form với ID "${id}" không tồn tại`);
    }

    return this.dataSource.transaction(async (manager) => {
      // Find current latest and demote it
      const currentLatest = await manager.findOne(DynamicForm, {
        where: { formKey: targetForm.formKey, tenantId: tenantId as any, isLatest: true },
      });

      let nextVersion = targetForm.version + 1;
      if (currentLatest) {
        nextVersion = currentLatest.version + 1;
        currentLatest.isLatest = false;
        await manager.save(DynamicForm, currentLatest);
      }

      // Create new version cloned from target
      const restoredForm = new DynamicForm();
      restoredForm.tenantId = tenantId;
      restoredForm.formKey = targetForm.formKey;
      restoredForm.name = targetForm.name;
      restoredForm.description = targetForm.description;
      restoredForm.version = nextVersion;
      restoredForm.isLatest = true;
      restoredForm.fields = targetForm.fields;

      const saved = await manager.save(DynamicForm, restoredForm);
      return { ...saved, restoredFromVersion: targetForm.version } as any;
    });
  }

  // ── Validate user submission data against a form version ──────────────────
  async validateData(
    id: string,
    tenantId: string | null,
    data: Record<string, any>,
  ): Promise<{ valid: boolean; errors: { field: string; message: string }[] }> {
    const form = await this.formRepository.findOne({
      where: { id, tenantId: tenantId as any },
    });

    if (!form) {
      throw new NotFoundException(`Phiên bản form với ID "${id}" không tồn tại`);
    }

    const errors = this.runValidation(form.fields, data);
    return { valid: errors.length === 0, errors };
  }

  // ── Internal: validate field schemas sent by admin ────────────────────────
  private validateFieldSchemas(fields: any[]): void {
    const ids = new Set<string>();
    for (const field of fields) {
      if (!field.id || !field.name || !field.type) {
        throw new BadRequestException(
          'Mỗi trường trong form phải có id, name và type (each field must have id, name and type)',
        );
      }
      if (!SUPPORTED_FIELD_TYPES.includes(field.type)) {
        throw new BadRequestException(
          `Kiểu trường "${field.type}" không được hỗ trợ. Các kiểu hợp lệ: ${SUPPORTED_FIELD_TYPES.join(', ')}`,
        );
      }
      if (ids.has(field.id)) {
        throw new BadRequestException(`Trường có id "${field.id}" bị trùng lặp (duplicate field id)`);
      }
      ids.add(field.id);

      // SELECT fields must have options
      if (field.type === 'SELECT') {
        if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
          throw new BadRequestException(
            `Trường SELECT "${field.id}" phải có danh sách options (options is required for SELECT type)`,
          );
        }
      }
    }
  }

  // ── Internal: run runtime validation of submitted user data ───────────────
  runValidation(
    fields: any[],
    data: Record<string, any>,
  ): { field: string; message: string }[] {
    const errors: { field: string; message: string }[] = [];

    for (const field of fields) {
      const fieldName: string = field.name;
      const value = data[fieldName];
      const isEmpty = value === undefined || value === null || value === '';

      // required check
      if (field.required && isEmpty) {
        errors.push({ field: fieldName, message: `Trường "${field.label || fieldName}" là bắt buộc` });
        continue; // no further validation when empty
      }

      if (isEmpty) {
        continue; // optional field with no value – skip
      }

      const validation = field.validation || {};

      if (field.type === 'TEXT' || field.type === 'TEXTAREA') {
        const strVal = String(value);
        if (validation.minLength !== undefined && strVal.length < validation.minLength) {
          errors.push({
            field: fieldName,
            message: `"${field.label || fieldName}" phải dài tối thiểu ${validation.minLength} ký tự`,
          });
        }
        if (validation.maxLength !== undefined && strVal.length > validation.maxLength) {
          errors.push({
            field: fieldName,
            message: `"${field.label || fieldName}" không được vượt quá ${validation.maxLength} ký tự`,
          });
        }
      }

      if (field.type === 'NUMBER') {
        const numVal = Number(value);
        if (isNaN(numVal)) {
          errors.push({ field: fieldName, message: `"${field.label || fieldName}" phải là số hợp lệ` });
        } else {
          if (validation.min !== undefined && numVal < validation.min) {
            errors.push({
              field: fieldName,
              message: `"${field.label || fieldName}" phải lớn hơn hoặc bằng ${validation.min}`,
            });
          }
          if (validation.max !== undefined && numVal > validation.max) {
            errors.push({
              field: fieldName,
              message: `"${field.label || fieldName}" phải nhỏ hơn hoặc bằng ${validation.max}`,
            });
          }
        }
      }

      if (field.type === 'DATE') {
        const dateVal = new Date(value);
        if (isNaN(dateVal.getTime())) {
          errors.push({ field: fieldName, message: `"${field.label || fieldName}" phải là ngày tháng hợp lệ` });
        }
      }

      if (field.type === 'SELECT') {
        const allowed = (field.options || []).map((o: any) => o.value);
        if (!allowed.includes(value)) {
          errors.push({
            field: fieldName,
            message: `"${field.label || fieldName}" phải thuộc một trong các giá trị: ${allowed.join(', ')}`,
          });
        }
      }
    }

    return errors;
  }
}
