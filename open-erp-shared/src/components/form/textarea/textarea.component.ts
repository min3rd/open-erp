import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';

@Component({
  selector: 'erp-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ],
  templateUrl: './textarea.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() rows: number = 3;
  @Input() maxLength?: number;
  @Input() showCount: boolean = false;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  value = signal<string>('');

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly currentLength = computed(() => this.value().length);

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

  onInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
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
