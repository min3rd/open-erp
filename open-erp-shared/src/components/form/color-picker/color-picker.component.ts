import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';

const DEFAULT_PRESETS = [
  '#4f46e5', '#3b82f6', '#06b6d4', '#10b981', '#84cc16',
  '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'
];

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ColorPickerComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly presets = input<string[]>(DEFAULT_PRESETS);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly helperText = input<string | undefined>(undefined);

  readonly valueChange = output<string>();

  color = signal<string>('#4f46e5');
  isDisabled = signal<boolean>(false);

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

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
    this.isDisabled.set(isDisabled);
  }

  onColorChange(val: string): void {
    if (this.effectiveDisabled()) return;
    this.color.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }
}
