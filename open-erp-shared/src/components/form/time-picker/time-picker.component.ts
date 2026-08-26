import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';

const SIZE_CLASSES: Record<string, string> = {
  [InputSize.SM]: 'py-1.5 px-3 text-xs rounded-xl',
  [InputSize.LG]: 'py-3 px-4 text-sm rounded-2xl',
  [InputSize.MD]: 'py-2.5 px-3.5 text-xs rounded-xl'
};

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TimePickerComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly size = input<InputSize | 'sm' | 'md' | 'lg'>(InputSize.MD);
  readonly status = input<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>(ValidationStatus.NONE);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly valueChange = output<string>();

  value = signal<string>('');
  isDisabled = signal<boolean>(false);

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  readonly sizeClass = computed(() => {
    const s = String(this.size());
    return SIZE_CLASSES[s] || SIZE_CLASSES[InputSize.MD];
  });

  readonly iconSize = computed(() => (this.size() === 'sm' ? 14 : 16));

  readonly skeletonHeight = computed(() => {
    const s = String(this.size());
    return s === 'lg' ? '2.875rem' : (s === 'sm' ? '2rem' : '2.5rem');
  });

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
    this.isDisabled.set(isDisabled);
  }

  onInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }

  setNow(): void {
    if (this.effectiveDisabled()) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;
    this.value.set(time);
    this.onChange(time);
    this.valueChange.emit(time);
  }
}
