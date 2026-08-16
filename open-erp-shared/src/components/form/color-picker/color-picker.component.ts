import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';

@Component({
  selector: 'erp-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true
    }
  ],
  templateUrl: './color-picker.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ColorPickerComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() presets: string[] = [
    '#4f46e5', '#3b82f6', '#06b6d4', '#10b981', '#84cc16',
    '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'
  ];
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() helperText?: string;

  @Output() valueChange = new EventEmitter<string>();

  color = signal<string>('#4f46e5');

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.color.set(val || '#4f46e5');
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

  onColorChange(val: string): void {
    if (this.disabled) return;
    this.color.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }
}
