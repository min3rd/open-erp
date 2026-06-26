import { Injectable, inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import {
  FormSchema,
  FormField,
  FieldType,
  ValidationRule,
  ConditionalRule,
  ConditionalOperator,
} from '../models/dynamic-form.model';

/**
 * FormEngineService
 *
 * Service trung tâm của Form Library, cung cấp 3 chức năng chính:
 *  1. buildFormGroup(schema)      — Tạo FormGroup từ FormSchema
 *  2. applyConditionalRules(...)  — Subscribe và xử lý visibility/cascade/setValue rules
 *  3. serializeFormValue(...)     — Serialize FormGroup value → JSON payload chuẩn backend
 */
@Injectable({ providedIn: 'root' })
export class FormEngineService {
  private readonly transloco = inject(TranslocoService);

  // =============================================
  // 1. Build FormGroup from Schema
  // =============================================

  buildFormGroup(schema: FormSchema): FormGroup {
    const controls: Record<string, AbstractControl> = {};

    for (const field of schema.fields) {
      const validators: ValidatorFn[] = this.buildValidators(field);

      // GRID field: tạo FormControl với value là array (danh sách rows)
      const initialValue = field.defaultValue ?? (field.type === FieldType.GRID ? [] : null);

      const control = new FormControl(
        { value: initialValue, disabled: !!field.disabled },
        validators,
      );

      if (field.hidden) {
        control.disable();
      }

      controls[field.name] = control;
    }

    return new FormGroup(controls);
  }

  private buildValidators(field: FormField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    for (const rule of field.validation ?? []) {
      switch (rule.type) {
        case 'minLength':
          if (rule.value !== undefined) validators.push(Validators.minLength(rule.value as number));
          break;
        case 'maxLength':
          if (rule.value !== undefined) validators.push(Validators.maxLength(rule.value as number));
          break;
        case 'min':
          if (rule.value !== undefined) validators.push(Validators.min(rule.value as number));
          break;
        case 'max':
          if (rule.value !== undefined) validators.push(Validators.max(rule.value as number));
          break;
        case 'pattern':
          if (rule.value !== undefined) validators.push(Validators.pattern(rule.value as string));
          break;
        case 'email':
          validators.push(Validators.email);
          break;
      }
    }

    return validators;
  }

  // =============================================
  // 2. Apply Conditional Rules (Visibility / Cascade / SetValue)
  // =============================================

  /**
   * Subscribe vào FormGroup.valueChanges và áp dụng tất cả conditional rules từ schema.
   * Trả về Subscription để caller có thể unsubscribe khi component bị destroy.
   *
   * Usage trong component:
   *   this.sub = this.formEngine.applyConditionalRules(this.schema, this.formGroup);
   *   ngOnDestroy() { this.sub.unsubscribe(); }
   */
  applyConditionalRules(schema: FormSchema, formGroup: FormGroup): Subscription {
    // Chạy lần đầu ngay lập tức để áp dụng trạng thái ban đầu
    this.evaluateAllRules(schema, formGroup);

    return formGroup.valueChanges.subscribe(() => {
      this.evaluateAllRules(schema, formGroup);
    });
  }

  private evaluateAllRules(schema: FormSchema, formGroup: FormGroup): void {
    for (const field of schema.fields) {
      for (const rule of field.conditionalRules ?? []) {
        this.evaluateRule(rule, formGroup);
      }
    }
  }

  private evaluateRule(rule: ConditionalRule, formGroup: FormGroup): void {
    const sourceControl = formGroup.get(rule.when.field);
    const targetControl = formGroup.get(rule.then.target);

    if (!sourceControl || !targetControl) return;

    const sourceValue = sourceControl.value;
    const conditionMet = this.evaluateOperator(
      sourceValue,
      rule.when.operator,
      rule.when.value,
    );

    if (conditionMet) {
      this.applyAction(rule.then.action, targetControl, rule.then.value);
    } else {
      // Đảo ngược action khi điều kiện không còn đúng
      this.reverseAction(rule.then.action, targetControl);
    }
  }

  private evaluateOperator(
    sourceValue: unknown,
    operator: ConditionalOperator,
    conditionValue: unknown,
  ): boolean {
    switch (operator) {
      case 'eq':
        return sourceValue === conditionValue;
      case 'neq':
        return sourceValue !== conditionValue;
      case 'gt':
        return (sourceValue as number) > (conditionValue as number);
      case 'lt':
        return (sourceValue as number) < (conditionValue as number);
      case 'gte':
        return (sourceValue as number) >= (conditionValue as number);
      case 'lte':
        return (sourceValue as number) <= (conditionValue as number);
      case 'contains':
        return String(sourceValue ?? '').includes(String(conditionValue ?? ''));
      case 'empty':
        return sourceValue === null || sourceValue === undefined || sourceValue === '';
      case 'notEmpty':
        return sourceValue !== null && sourceValue !== undefined && sourceValue !== '';
      default:
        return false;
    }
  }

  private applyAction(
    action: string,
    control: AbstractControl,
    value?: unknown,
  ): void {
    switch (action) {
      case 'show':
        control.enable({ emitEvent: false });
        break;
      case 'hide':
        control.disable({ emitEvent: false });
        break;
      case 'enable':
        control.enable({ emitEvent: false });
        break;
      case 'disable':
        control.disable({ emitEvent: false });
        break;
      case 'require':
        if (!control.hasValidator(Validators.required)) {
          control.addValidators(Validators.required);
          control.updateValueAndValidity({ emitEvent: false });
        }
        break;
      case 'setValue':
        control.setValue(value, { emitEvent: false });
        break;
    }
  }

  private reverseAction(action: string, control: AbstractControl): void {
    switch (action) {
      case 'hide':
        // Nếu action là 'hide' và condition không còn đúng → show lại
        control.enable({ emitEvent: false });
        break;
      case 'show':
        // Nếu action là 'show' và condition không còn đúng → hide
        control.disable({ emitEvent: false });
        break;
      case 'require':
        control.removeValidators(Validators.required);
        control.updateValueAndValidity({ emitEvent: false });
        break;
      case 'disable':
        control.enable({ emitEvent: false });
        break;
      case 'enable':
        // Không đảo ngược enable
        break;
    }
  }

  // =============================================
  // 3. Serialize FormGroup Value → Backend Payload
  // =============================================

  /**
   * Serialize giá trị form về JSON payload tương thích backend.
   * - Bỏ qua các field bị disabled (hidden/disabled)
   * - Chuyển Date object → ISO string
   * - GRID field: trả về nguyên array
   */
  serializeFormValue(
    schema: FormSchema,
    formGroup: FormGroup,
    includeDisabled = false,
  ): Record<string, unknown> {
    const raw = includeDisabled
      ? formGroup.getRawValue()
      : formGroup.value;

    const result: Record<string, unknown> = {};

    for (const field of schema.fields) {
      const value = raw[field.name];

      if (value === undefined) continue;

      if (value instanceof Date) {
        result[field.name] = value.toISOString();
      } else if (value === '') {
        result[field.name] = null;
      } else {
        result[field.name] = value;
      }
    }

    return result;
  }

  // =============================================
  // 4. Utility: Get first validation error message
  // =============================================

  getFirstErrorMessage(control: AbstractControl, schema: FormSchema, fieldName: string): string {
    if (!control.errors) return '';

    const field = schema.fields.find((f) => f.name === fieldName);
    const validationRules = field?.validation ?? [];

    // Ưu tiên custom message từ schema, fallback sang transloco key
    if (control.errors['required']) {
      const rule = validationRules.find((r) => r.type === 'required');
      return rule?.message ?? this.transloco.translate('form.error_required');
    }
    if (control.errors['minlength']) {
      const rule = validationRules.find((r) => r.type === 'minLength');
      return rule?.message ?? this.transloco.translate('form.error_min_length', { min: control.errors['minlength'].requiredLength });
    }
    if (control.errors['maxlength']) {
      const rule = validationRules.find((r) => r.type === 'maxLength');
      return rule?.message ?? this.transloco.translate('form.error_max_length', { max: control.errors['maxlength'].requiredLength });
    }
    if (control.errors['min']) {
      const rule = validationRules.find((r) => r.type === 'min');
      return rule?.message ?? this.transloco.translate('form.error_min', { min: control.errors['min'].min });
    }
    if (control.errors['max']) {
      const rule = validationRules.find((r) => r.type === 'max');
      return rule?.message ?? this.transloco.translate('form.error_max', { max: control.errors['max'].max });
    }
    if (control.errors['pattern']) {
      const rule = validationRules.find((r) => r.type === 'pattern');
      return rule?.message ?? this.transloco.translate('form.error_pattern');
    }
    if (control.errors['email']) {
      return this.transloco.translate('form.error_email');
    }

    return this.transloco.translate('form.error_invalid');
  }
}
