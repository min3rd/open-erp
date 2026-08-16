import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';

export interface DateRange {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'erp-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true
    }
  ],
  templateUrl: './date-range-picker.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DateRangePickerComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() rangeChange = new EventEmitter<DateRange>();

  startDate = signal<string>('');
  endDate = signal<string>('');

  onChange: (val: DateRange) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    if (val && typeof val === 'object') {
      this.startDate.set(val.startDate || '');
      this.endDate.set(val.endDate || '');
    } else {
      this.startDate.set('');
      this.endDate.set('');
    }
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

  onStartChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.startDate.set(val);
    this.emitRange();
  }

  onEndChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.endDate.set(val);
    this.emitRange();
  }

  private emitRange(): void {
    const range: DateRange = { startDate: this.startDate(), endDate: this.endDate() };
    this.onChange(range);
    this.rangeChange.emit(range);
  }

  setShortcut(type: 'today' | 'week' | 'month' | 'quarter'): void {
    if (this.disabled) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (type === 'today') {
      this.startDate.set(todayStr);
      this.endDate.set(todayStr);
    } else if (type === 'week') {
      const first = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      const last = new Date(now.setDate(now.getDate() - now.getDay() + 7));
      this.startDate.set(first.toISOString().split('T')[0]);
      this.endDate.set(last.toISOString().split('T')[0]);
    } else if (type === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      this.startDate.set(first.toISOString().split('T')[0]);
      this.endDate.set(last.toISOString().split('T')[0]);
    } else if (type === 'quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const first = new Date(now.getFullYear(), qMonth, 1);
      const last = new Date(now.getFullYear(), qMonth + 3, 0);
      this.startDate.set(first.toISOString().split('T')[0]);
      this.endDate.set(last.toISOString().split('T')[0]);
    }
    this.emitRange();
  }
}
