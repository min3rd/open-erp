import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { RatingSize } from '../../../enums/component.enum';

@Component({
  selector: 'erp-rating',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent, LabelComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingComponent),
      multi: true
    }
  ],
  templateUrl: './rating.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class RatingComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() max: number = 5;
  @Input() size: RatingSize | 'sm' | 'md' | 'lg' = RatingSize.MD;
  @Input() allowClear: boolean = true;
  @Input() readonly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  @Output() ratingChange = new EventEmitter<number>();

  rating = signal<number>(0);
  hoverValue = signal<number>(0);

  onChange: (val: number) => void = () => {};
  onTouched: () => void = () => {};

  readonly stars = computed(() => Array.from({ length: this.max }, (_, i) => i + 1));

  writeValue(val: any): void {
    this.rating.set(typeof val === 'number' ? val : 0);
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

  setRating(val: number): void {
    if (this.disabled || this.readonly) return;
    const next = this.allowClear && this.rating() === val ? 0 : val;
    this.rating.set(next);
    this.onChange(next);
    this.ratingChange.emit(next);
  }

  onStarHover(val: number): void {
    if (!this.disabled && !this.readonly) {
      this.hoverValue.set(val);
    }
  }

  onMouseLeave(): void {
    this.hoverValue.set(0);
  }

  getStarSize(): number {
    const s = String(this.size);
    switch (s) {
      case RatingSize.SM:
      case 'sm':
        return 16;
      case RatingSize.LG:
      case 'lg':
        return 28;
      case RatingSize.MD:
      case 'md':
      default:
        return 22;
    }
  }
}
