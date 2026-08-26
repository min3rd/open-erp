import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';

export interface RadioOption {
  label: string;
  value: any;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
}

@Component({
  selector: 'erp-radio-group',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true
    }
  ],
  templateUrl: './radio-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class RadioGroupComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly options = input<RadioOption[]>([]);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly cardMode = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);

  readonly valueChange = output<any>();

  selectedValue = signal<any>(null);
  isDisabled = signal<boolean>(false);

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  writeValue(val: any): void {
    this.selectedValue.set(val);
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

  selectOption(opt: RadioOption): void {
    if (this.effectiveDisabled() || opt.disabled) return;
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
  }

  onKeyDown(event: KeyboardEvent, opt: RadioOption): void {
    if (this.effectiveDisabled() || opt.disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.selectOption(opt);
    } else if (['ArrowDown', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      this.selectNext(1);
    } else if (['ArrowUp', 'ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      this.selectNext(-1);
    }
  }

  private selectNext(direction: number): void {
    const opts = this.options();
    if (opts.length === 0) return;
    const currentIdx = opts.findIndex(o => o.value === this.selectedValue());
    let nextIdx = currentIdx + direction;
    if (nextIdx < 0) nextIdx = opts.length - 1;
    if (nextIdx >= opts.length) nextIdx = 0;

    while (nextIdx !== currentIdx && opts[nextIdx].disabled) {
      nextIdx += direction;
      if (nextIdx < 0) nextIdx = opts.length - 1;
      if (nextIdx >= opts.length) nextIdx = 0;
    }

    if (!opts[nextIdx].disabled) {
      this.selectOption(opts[nextIdx]);
    }
  }
}
