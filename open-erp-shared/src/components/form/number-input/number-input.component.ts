import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';

@Component({
  selector: 'erp-number-input',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true
    }
  ],
  templateUrl: './number-input.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class NumberInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder: string = '0';
  @Input() min: number = -Infinity;
  @Input() max: number = Infinity;
  @Input() step: number = 1;
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() size: InputSize | 'sm' | 'md' | 'lg' = InputSize.MD;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() valueChange = new EventEmitter<number | null>();

  value = signal<number | null>(null);

  onChange: (val: number | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    const num = typeof val === 'number' ? val : (val !== null && val !== undefined && val !== '' ? Number(val) : null);
    this.value.set(num);
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

  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const val = raw === '' ? null : Number(raw);
    this.updateValue(val);
  }

  increment(): void {
    if (this.disabled) return;
    const cur = this.value() ?? 0;
    const next = Math.min(this.max, cur + this.step);
    this.updateValue(next);
  }

  decrement(): void {
    if (this.disabled) return;
    const cur = this.value() ?? 0;
    const next = Math.max(this.min, cur - this.step);
    this.updateValue(next);
  }

  private updateValue(val: number | null): void {
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
