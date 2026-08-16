import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
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
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class RadioGroupComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() options: RadioOption[] = [];
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() cardMode: boolean = false;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;
  @Input() helperText?: string;
  @Input() errorMessage?: string;

  @Output() valueChange = new EventEmitter<any>();

  selectedValue = signal<any>(null);

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

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
    this.disabled = isDisabled;
  }

  selectOption(opt: RadioOption): void {
    if (this.disabled || opt.disabled) return;
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
  }
}
