import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { InputSize } from '../../../enums/component.enum';

@Component({
  selector: 'erp-switch',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true
    }
  ],
  templateUrl: './switch.component.html'
})
export class SwitchComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() description?: string;
  @Input() size: InputSize | 'sm' | 'md' | 'lg' = InputSize.MD;
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
