import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';

@Component({
  selector: 'erp-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  templateUrl: './input.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() size: InputSize | 'sm' | 'md' | 'lg' = InputSize.MD;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() prefixIcon?: IconName;
  @Input() suffixIcon?: IconName;
  @Input() clearable: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  value: string = '';

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val !== undefined && val !== null ? String(val) : '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
    this.valueChange.emit(val);
  }

  onClear(): void {
    this.value = '';
    this.onChange('');
    this.valueChange.emit('');
    this.clear.emit();
  }

  getSizeClasses(): string {
    const s = String(this.size);
    switch (s) {
      case InputSize.SM:
      case 'sm':
        return 'py-1.5 px-3 text-xs rounded-xl';
      case InputSize.LG:
      case 'lg':
        return 'py-3 px-4 text-sm rounded-2xl';
      case InputSize.MD:
      case 'md':
      default:
        return 'py-2.5 px-3.5 text-xs rounded-xl';
    }
  }

  getStatusClasses(): string {
    const st = String(this.status);
    if (this.errorMessage || st === ValidationStatus.INVALID || st === 'invalid') {
      return 'border-rose-500 focus:ring-rose-500/30 text-rose-900 dark:text-rose-100';
    }
    if (st === ValidationStatus.VALID || st === 'valid') {
      return 'border-emerald-500 focus:ring-emerald-500/30 text-emerald-900 dark:text-emerald-100';
    }
    if (st === ValidationStatus.WARNING || st === 'warning') {
      return 'border-amber-500 focus:ring-amber-500/30 text-amber-900 dark:text-amber-100';
    }
    return 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white';
  }
}
