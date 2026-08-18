import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
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
  @Input() options: (string | SegmentedControlOption)[] = [];
  @Input() value: any;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth: boolean = false;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  @Output() valueChange = new EventEmitter<any>();

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  get normalizedOptions(): SegmentedControlOption[] {
    return this.options.map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }

  writeValue(val: any): void {
    this.value = val;
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

  selectOption(opt: SegmentedControlOption): void {
    if (this.disabled || opt.disabled || this.value === opt.value) return;
    this.value = opt.value;
    this.onChange(opt.value);
    this.onTouched();
    this.valueChange.emit(opt.value);
  }

  getSizeClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs gap-1 rounded-lg';
      case 'lg':
        return 'px-5 py-2.5 text-sm gap-2 rounded-xl font-bold';
      case 'md':
      default:
        return 'px-3.5 py-1.5 text-xs gap-1.5 rounded-xl font-semibold';
    }
  }

  getContainerSizeClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'p-0.5 rounded-xl';
      case 'lg':
        return 'p-1.5 rounded-2xl';
      case 'md':
      default:
        return 'p-1 rounded-2xl';
    }
  }
}
