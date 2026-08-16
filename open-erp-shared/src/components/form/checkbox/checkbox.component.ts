import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';

@Component({
  selector: 'erp-checkbox',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
  templateUrl: './checkbox.component.html'
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() description?: string;
  @Input() indeterminate: boolean = false;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  @Output() checkedChange = new EventEmitter<boolean>();

  checked = signal<boolean>(false);

  onChange: (val: boolean) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.checked.set(Boolean(val));
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

  toggle(): void {
    if (this.disabled) return;
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
    this.checkedChange.emit(next);
  }
}
