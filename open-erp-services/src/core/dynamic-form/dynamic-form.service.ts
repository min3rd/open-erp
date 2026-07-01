import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DynamicForm, FieldType, FormLayout, FormField } from './entities/dynamic-form.entity';

// ─── Field types supported ────────────────────────────────────────────────────
const SUPPORTED_FIELD_TYPES = Object.values(FieldType) as string[];

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
      fields: FormField[];
      layout?: FormLayout;
    },
  ): Promise<DynamicForm> {
    const { formKey, name, description, fields, layout } = dto;

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

    // Validate layout schema
    this.validateLayoutSchema(layout, fields);

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
      newForm.layout = layout || null;

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

  async getLatestByKey(formKey: string, tenantId: string | null): Promise<DynamicForm> {
    const form = await this.formRepository.findOne({
      where: { formKey, tenantId: tenantId as any, isLatest: true },
      order: { version: 'DESC' },
    });

    if (!form) {
      throw new NotFoundException({
        success: false,
        error: { code: 'FORM_NOT_FOUND', messageKey: 'dynamic_form.not_found' },
      });
    }

    return form;
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
      restoredForm.layout = targetForm.layout;

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
  private validateFieldSchemas(fields: FormField[]): void {
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
      if (field.type === FieldType.SELECT) {
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

      // GRID fields must have columns defined
      if (field.type === FieldType.GRID) {
        if (!field.columns || !Array.isArray(field.columns) || field.columns.length === 0) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'GRID_COLUMNS_REQUIRED',
              messageKey: 'dynamic_form.grid_columns_required',
              meta: { fieldId: field.id },
            },
          });
        }
        const colNames = new Set<string>();
        for (const col of field.columns) {
          if (!col.name || !col.type || !col.label) {
            throw new BadRequestException({
              success: false,
              error: {
                code: 'GRID_COLUMN_MISSING_ATTRS',
                messageKey: 'dynamic_form.grid_column_missing_attrs',
                meta: { fieldId: field.id },
              },
            });
          }
          const SUPPORTED_GRID_COL_TYPES = [FieldType.TEXT, FieldType.NUMBER, FieldType.DATE, FieldType.SELECT] as string[];
          if (!SUPPORTED_GRID_COL_TYPES.includes(col.type)) {
            throw new BadRequestException({
              success: false,
              error: {
                code: 'UNSUPPORTED_GRID_COLUMN_TYPE',
                messageKey: 'dynamic_form.unsupported_grid_column_type',
                meta: { fieldId: field.id, type: col.type, supported: SUPPORTED_GRID_COL_TYPES },
              },
            });
          }
          if (colNames.has(col.name)) {
            throw new BadRequestException({
              success: false,
              error: {
                code: 'DUPLICATE_GRID_COLUMN_NAME',
                messageKey: 'dynamic_form.duplicate_grid_column_name',
                meta: { fieldId: field.id, columnName: col.name },
              },
            });
          }
          colNames.add(col.name);
          if (col.type === FieldType.SELECT) {
            if (!col.options || !Array.isArray(col.options) || col.options.length === 0) {
              throw new BadRequestException({
                success: false,
                error: {
                  code: 'GRID_COLUMN_SELECT_OPTIONS_REQUIRED',
                  messageKey: 'dynamic_form.grid_column_select_options_required',
                  meta: { fieldId: field.id, columnName: col.name },
                },
              });
            }
          }
        }
      }
    }
  }

  // ── Internal: run runtime validation of submitted user data ───────────────
  runValidation(
    fields: FormField[],
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

      if (field.type === FieldType.TEXT || field.type === FieldType.TEXTAREA) {
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

      if (field.type === FieldType.NUMBER) {
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

      if (field.type === FieldType.DATE) {
        const dateVal = new Date(value);
        if (isNaN(dateVal.getTime())) {
          errors.push({
            field: fieldName,
            messageKey: 'form.validation.invalid_date',
            meta: { label: field.label || fieldName },
          });
        }
      }

      if (field.type === FieldType.SELECT) {
        const allowed = (field.options || []).map((o: any) => o.value);
        if (!allowed.includes(value)) {
          errors.push({
            field: fieldName,
            messageKey: 'form.validation.invalid_option',
            meta: { label: field.label || fieldName, allowed },
          });
        }
      }

      if (field.type === FieldType.GRID) {
        if (value && !Array.isArray(value)) {
          errors.push({
            field: fieldName,
            messageKey: 'form.validation.invalid_grid_data',
            meta: { label: field.label || fieldName },
          });
          continue;
        }
        if (value) {
          const columns: any[] = field.columns || [];
          for (let i = 0; i < value.length; i++) {
            const row = value[i];
            for (const col of columns) {
              const cellValue = row[col.name];
              const isCellEmpty = cellValue === undefined || cellValue === null || cellValue === '';

              if (col.required && isCellEmpty) {
                errors.push({
                  field: `${fieldName}[${i}].${col.name}`,
                  messageKey: 'form.validation.required',
                  meta: { label: col.label || col.name },
                });
                continue;
              }

              if (isCellEmpty) {
                continue;
              }

              const colValRules = col.validation || {};
              if (col.type === FieldType.TEXT) {
                const strVal = String(cellValue);
                if (colValRules.minLength !== undefined && strVal.length < colValRules.minLength) {
                  errors.push({
                    field: `${fieldName}[${i}].${col.name}`,
                    messageKey: 'form.validation.min_length',
                    meta: { label: col.label || col.name, min: colValRules.minLength },
                  });
                }
                if (colValRules.maxLength !== undefined && strVal.length > colValRules.maxLength) {
                  errors.push({
                    field: `${fieldName}[${i}].${col.name}`,
                    messageKey: 'form.validation.max_length',
                    meta: { label: col.label || col.name, max: colValRules.maxLength },
                  });
                }
              }

              if (col.type === 'NUMBER') {
                const numVal = Number(cellValue);
                if (isNaN(numVal)) {
                  errors.push({
                    field: `${fieldName}[${i}].${col.name}`,
                    messageKey: 'form.validation.invalid_number',
                    meta: { label: col.label || col.name },
                  });
                } else {
                  if (colValRules.min !== undefined && numVal < colValRules.min) {
                    errors.push({
                      field: `${fieldName}[${i}].${col.name}`,
                      messageKey: 'form.validation.min_value',
                      meta: { label: col.label || col.name, min: colValRules.min },
                    });
                  }
                  if (colValRules.max !== undefined && numVal > colValRules.max) {
                    errors.push({
                      field: `${fieldName}[${i}].${col.name}`,
                      messageKey: 'form.validation.max_value',
                      meta: { label: col.label || col.name, max: colValRules.max },
                    });
                  }
                }
              }

              if (col.type === FieldType.DATE) {
                const dateVal = new Date(cellValue);
                if (isNaN(dateVal.getTime())) {
                  errors.push({
                    field: `${fieldName}[${i}].${col.name}`,
                    messageKey: 'form.validation.invalid_date',
                    meta: { label: col.label || col.name },
                  });
                }
              }

              if (col.type === FieldType.SELECT) {
                const allowed = (col.options || []).map((o: any) => o.value);
                if (!allowed.includes(cellValue)) {
                  errors.push({
                    field: `${fieldName}[${i}].${col.name}`,
                    messageKey: 'form.validation.invalid_option',
                    meta: { label: col.label || col.name, allowed },
                  });
                }
              }
            }
          }
        }
      }
    }

    return errors;
  }

  // ── Internal: validate layout schema ──────────────────────────────────────
  private validateLayoutSchema(layout: FormLayout | undefined | null, fields: FormField[]): void {
    if (!layout) return;
    if (typeof layout !== 'object') {
      throw new BadRequestException({
        success: false,
        error: { code: 'LAYOUT_INVALID', messageKey: 'dynamic_form.layout_must_be_object' },
      });
    }
    const fieldIds = new Set(fields.map(f => f.id));
    if (layout.rows) {
      if (!Array.isArray(layout.rows)) {
        throw new BadRequestException({
          success: false,
          error: { code: 'LAYOUT_ROWS_INVALID', messageKey: 'dynamic_form.layout_rows_must_be_array' },
        });
      }
      for (const row of layout.rows) {
        if (row.columns) {
          if (!Array.isArray(row.columns)) {
            throw new BadRequestException({
              success: false,
              error: { code: 'LAYOUT_COLUMNS_INVALID', messageKey: 'dynamic_form.layout_columns_must_be_array' },
            });
          }
          for (const col of row.columns) {
            if (col.fieldId && !fieldIds.has(col.fieldId)) {
              throw new BadRequestException({
                success: false,
                error: {
                  code: 'LAYOUT_REFERENCED_FIELD_NOT_FOUND',
                  messageKey: 'dynamic_form.layout_referenced_field_not_found',
                  meta: { fieldId: col.fieldId },
                },
              });
            }
          }
        }
      }
    }
  }
}
