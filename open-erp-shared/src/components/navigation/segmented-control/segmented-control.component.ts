import { Component, ChangeDetectionStrategy, input, model, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';

export interface SegmentedControlOption {
  label: string;
  value: any;
  icon?: IconName;
  badge?: string | number;
  disabled?: boolean;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1 rounded-lg',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl font-bold',
  md: 'px-3.5 py-1.5 text-xs gap-1.5 rounded-xl font-semibold'
};

const CONTAINER_SIZE_CLASSES: Record<string, string> = {
  sm: 'p-0.5 rounded-xl',
  lg: 'p-1.5 rounded-2xl',
  md: 'p-1 rounded-2xl'
};

@Component({
  selector: 'erp-segmented-control',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedControlComponent),
      multi: true
    }
  ],
  templateUrl: './segmented-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: inline-block;
    }
    :host([block]) {
      display: block;
      width: 100%;
    }
  `]
})
export class SegmentedControlComponent implements ControlValueAccessor {
  readonly options = input<(string | SegmentedControlOption)[]>([]);
  readonly value = model<any>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly fullWidth = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  isDisabled = signal<boolean>(false);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  readonly normalizedOptions = computed<SegmentedControlOption[]>(() => {
    return this.options().map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  });

  readonly sizeClass = computed(() => {
    return SIZE_CLASSES[this.size()] || SIZE_CLASSES['md'];
  });

  readonly containerSizeClass = computed(() => {
    return CONTAINER_SIZE_CLASSES[this.size()] || CONTAINER_SIZE_CLASSES['md'];
  });

  readonly iconSize = computed(() => (this.size() === 'lg' ? 18 : 14));

  writeValue(val: any): void {
    this.value.set(val);
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

  selectOption(opt: SegmentedControlOption): void {
    if (this.effectiveDisabled() || opt.disabled || this.value() === opt.value) return;
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.onTouched();
  }

  onKeyDown(event: KeyboardEvent, currentIndex: number): void {
    if (this.effectiveDisabled()) return;
    const opts = this.normalizedOptions();
    if (opts.length === 0) return;

    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % opts.length;
      while (opts[nextIndex].disabled && nextIndex !== currentIndex) {
        nextIndex = (nextIndex + 1) % opts.length;
      }
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + opts.length) % opts.length;
      while (opts[nextIndex].disabled && nextIndex !== currentIndex) {
        nextIndex = (nextIndex - 1 + opts.length) % opts.length;
      }
    }

    if (nextIndex !== currentIndex && !opts[nextIndex].disabled) {
      this.selectOption(opts[nextIndex]);
    }
  }
}
