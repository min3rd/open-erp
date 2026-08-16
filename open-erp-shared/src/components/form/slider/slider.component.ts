import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';

@Component({
  selector: 'erp-slider',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true
    }
  ],
  templateUrl: './slider.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class SliderComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() showValue: boolean = true;
  @Input() unit?: string;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() helperText?: string;

  @Output() valueChange = new EventEmitter<number>();

  value = signal<number>(0);

  onChange: (val: number) => void = () => {};
  onTouched: () => void = () => {};

  readonly percentage = computed(() => {
    const range = this.max - this.min;
    if (range <= 0) return 0;
    return ((this.value() - this.min) / range) * 100;
  });

  writeValue(val: any): void {
    this.value.set(typeof val === 'number' ? val : this.min);
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

  onSliderInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }
}
