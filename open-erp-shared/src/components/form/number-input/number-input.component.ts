import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class NumberInputComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string>('0');
  readonly min = input<number>(-Infinity);
  readonly max = input<number>(Infinity);
  readonly step = input<number>(1);
  readonly prefix = input<string | undefined>(undefined);
  readonly suffix = input<string | undefined>(undefined);
  readonly size = input<InputSize | 'sm' | 'md' | 'lg'>(InputSize.MD);
  readonly status = input<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>(ValidationStatus.NONE);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly valueChange = output<number | null>();

  value = signal<number | null>(null);
  isDisabled = signal<boolean>(false);

  onChange: (val: number | null) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  readonly sizeClass = computed(() => {
    const s = String(this.size());
    return SIZE_CLASSES[s] || SIZE_CLASSES[InputSize.MD];
  });

  readonly statusClass = computed(() => {
    const err = this.errorMessage();
    const st = String(this.status());
    if (err || st === ValidationStatus.INVALID || st === 'invalid') {
      return 'border-rose-500 focus:ring-rose-500/30 text-rose-900 dark:text-rose-100';
    }
    if (st === ValidationStatus.VALID || st === 'valid') {
      return 'border-emerald-500 focus:ring-emerald-500/30 text-emerald-900 dark:text-emerald-100';
    }
    return 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white';
  });

  readonly skeletonHeight = computed(() => {
    const s = String(this.size());
    return s === 'lg' ? '2.875rem' : (s === 'sm' ? '2rem' : '2.5rem');
  });

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
    this.isDisabled.set(isDisabled);
  }

  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const val = raw === '' ? null : Number(raw);
    this.updateValue(val);
  }

  increment(): void {
    if (this.effectiveDisabled()) return;
    const cur = this.value() ?? 0;
    const next = Math.min(this.max(), cur + this.step());
    this.updateValue(next);
  }

  decrement(): void {
    if (this.effectiveDisabled()) return;
    const cur = this.value() ?? 0;
    const next = Math.max(this.min(), cur - this.step());
    this.updateValue(next);
  }

  private updateValue(val: number | null): void {
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }
}
