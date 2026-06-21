import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DynamicForm } from './entities/dynamic-form.entity';

// ─── Field types supported ────────────────────────────────────────────────────
const SUPPORTED_FIELD_TYPES = ['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX', 'FILE'];

// ─── Validation error shape ───────────────────────────────────────────────────
export interface FieldValidationError {
  field: string;
  /** i18n key resolved by frontend — e.g. 'form.validation.required' */
  messageKey: string;
  /** Dynamic parameters interpolated by frontend translator */
  meta?: Record<string, any>;
}

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
      throw new BadRequestException({
        success: false,
        error: { code: 'FORM_KEY_REQUIRED', messageKey: 'dynamic_form.form_key_required' },
      });
    }
    if (!name || !name.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'FORM_NAME_REQUIRED', messageKey: 'dynamic_form.name_required' },
      });
    }
    if (!fields || !Array.isArray(fields)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'FIELDS_INVALID', messageKey: 'dynamic_form.fields_must_be_array' },
      });
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
      throw new NotFoundException({
        success: false,
        error: { code: 'FORM_NOT_FOUND', messageKey: 'dynamic_form.not_found' },
      });
    }

    return forms;
  }

  // ── Restore a specific version (clone it as new latest) ───────────────────
  async restoreVersion(id: string, tenantId: string | null): Promise<DynamicForm> {
    const targetForm = await this.formRepository.findOne({
      where: { id, tenantId: tenantId as any },
    });

    if (!targetForm) {
      throw new NotFoundException({
        success: false,
        error: { code: 'FORM_VERSION_NOT_FOUND', messageKey: 'dynamic_form.version_not_found' },
      });
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
  ): Promise<{ valid: boolean; errors: FieldValidationError[] }> {
    const form = await this.formRepository.findOne({
      where: { id, tenantId: tenantId as any },
    });

    if (!form) {
      throw new NotFoundException({
        success: false,
        error: { code: 'FORM_VERSION_NOT_FOUND', messageKey: 'dynamic_form.version_not_found' },
      });
    }

    const errors = this.runValidation(form.fields, data);
    return { valid: errors.length === 0, errors };
  }

  // ── Internal: validate field schemas sent by admin ────────────────────────
  private validateFieldSchemas(fields: any[]): void {
    const ids = new Set<string>();
    for (const field of fields) {
      if (!field.id || !field.name || !field.type) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'FIELD_MISSING_REQUIRED_ATTRS',
            messageKey: 'dynamic_form.field_missing_required_attrs',
          },
        });
      }
      if (!SUPPORTED_FIELD_TYPES.includes(field.type)) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'UNSUPPORTED_FIELD_TYPE',
            messageKey: 'dynamic_form.unsupported_field_type',
            meta: { type: field.type, supported: SUPPORTED_FIELD_TYPES },
          },
        });
      }
      if (ids.has(field.id)) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'DUPLICATE_FIELD_ID',
            messageKey: 'dynamic_form.duplicate_field_id',
            meta: { fieldId: field.id },
          },
        });
      }
      ids.add(field.id);

      // SELECT fields must have options
      if (field.type === 'SELECT') {
        if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'SELECT_OPTIONS_REQUIRED',
              messageKey: 'dynamic_form.select_options_required',
              meta: { fieldId: field.id },
            },
          });
        }
      }
    }
  }

  // ── Internal: run runtime validation of submitted user data ───────────────
  runValidation(
    fields: any[],
    data: Record<string, any>,
  ): FieldValidationError[] {
    const errors: FieldValidationError[] = [];

    for (const field of fields) {
      const fieldName: string = field.name;
      const value = data[fieldName];
      const isEmpty = value === undefined || value === null || value === '';

      // required check
      if (field.required && isEmpty) {
        errors.push({
          field: fieldName,
          messageKey: 'form.validation.required',
          meta: { label: field.label || fieldName },
        });
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
            messageKey: 'form.validation.min_length',
            meta: { label: field.label || fieldName, min: validation.minLength },
          });
        }
        if (validation.maxLength !== undefined && strVal.length > validation.maxLength) {
          errors.push({
            field: fieldName,
            messageKey: 'form.validation.max_length',
            meta: { label: field.label || fieldName, max: validation.maxLength },
          });
        }
      }

      if (field.type === 'NUMBER') {
        const numVal = Number(value);
        if (isNaN(numVal)) {
          errors.push({
            field: fieldName,
            messageKey: 'form.validation.invalid_number',
            meta: { label: field.label || fieldName },
          });
        } else {
          if (validation.min !== undefined && numVal < validation.min) {
            errors.push({
              field: fieldName,
              messageKey: 'form.validation.min_value',
              meta: { label: field.label || fieldName, min: validation.min },
            });
          }
          if (validation.max !== undefined && numVal > validation.max) {
            errors.push({
              field: fieldName,
              messageKey: 'form.validation.max_value',
              meta: { label: field.label || fieldName, max: validation.max },
            });
          }
        }
      }

      if (field.type === 'DATE') {
        const dateVal = new Date(value);
        if (isNaN(dateVal.getTime())) {
          errors.push({
            field: fieldName,
            messageKey: 'form.validation.invalid_date',
            meta: { label: field.label || fieldName },
          });
        }
      }

      if (field.type === 'SELECT') {
        const allowed = (field.options || []).map((o: any) => o.value);
        if (!allowed.includes(value)) {
          errors.push({
            field: fieldName,
            messageKey: 'form.validation.invalid_option',
            meta: { label: field.label || fieldName, allowed },
          });
        }
      }
    }

    return errors;
  }
}
