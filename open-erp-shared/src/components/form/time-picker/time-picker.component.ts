import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';

@Component({
  selector: 'erp-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true
    }
  ],
  templateUrl: './time-picker.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TimePickerComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() size: InputSize | 'sm' | 'md' | 'lg' = InputSize.MD;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  value = signal<string>('');

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value.set(val || '');
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
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }

  setNow(): void {
    if (this.disabled) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;
    this.value.set(time);
    this.onChange(time);
    this.valueChange.emit(time);
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
}
