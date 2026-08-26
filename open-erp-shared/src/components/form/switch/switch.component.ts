import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal } from '@angular/core';
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
  templateUrl: './switch.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly size = input<InputSize | 'sm' | 'md' | 'lg'>(InputSize.MD);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly checkedChange = output<boolean>();

  checked = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

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
    this.isDisabled.set(isDisabled);
  }

  toggle(): void {
    if (this.disabled() || this.isDisabled()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
    this.checkedChange.emit(next);
    this.onTouched();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle();
    }
  }
}
