import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';

@Component({
  selector: 'erp-password-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true
    }
  ],
  templateUrl: './password-input.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PasswordInputComponent implements ControlValueAccessor {
  @Input() label?: string = 'Mật khẩu';
  @Input() placeholder: string = '••••••••';
  @Input() size: InputSize | 'sm' | 'md' | 'lg' = InputSize.MD;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() showStrengthMeter: boolean = false;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  value = signal<string>('');
  showPassword = signal<boolean>(false);

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly passwordStrength = computed(() => {
    const val = this.value();
    if (!val) return 0;
    let score = 0;
    if (val.length >= 8) score += 25;
    if (/[A-Z]/.test(val)) score += 25;
    if (/[0-9]/.test(val)) score += 25;
    if (/[^A-Za-z0-9]/.test(val)) score += 25;
    return score;
  });

  readonly strengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s <= 25) return 'Rất yếu';
    if (s <= 50) return 'Trung bình';
    if (s <= 75) return 'Khá';
    return 'Rất mạnh';
  });

  readonly strengthColor = computed(() => {
    const s = this.passwordStrength();
    if (s <= 25) return 'bg-rose-500';
    if (s <= 50) return 'bg-amber-500';
    if (s <= 75) return 'bg-indigo-500';
    return 'bg-emerald-500';
  });

  writeValue(val: any): void {
    this.value.set(val !== undefined && val !== null ? String(val) : '');
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

  togglePasswordVisibility(): void {
    this.showPassword.update(prev => !prev);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
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
    return 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white';
  }
}
