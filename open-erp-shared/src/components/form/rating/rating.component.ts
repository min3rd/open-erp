import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { RatingSize } from '../../../enums/component.enum';

const STAR_SIZES: Record<string, number> = {
  [RatingSize.SM]: 16,
  [RatingSize.LG]: 28,
  [RatingSize.MD]: 22
};

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class RatingComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly max = input<number>(5);
  readonly size = input<RatingSize | 'sm' | 'md' | 'lg'>(RatingSize.MD);
  readonly allowClear = input<boolean>(true);
  readonly readonly = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly ratingChange = output<number>();

  rating = signal<number>(0);
  hoverValue = signal<number>(0);
  isDisabled = signal<boolean>(false);

  onChange: (val: number) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  readonly stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));

  readonly starSize = computed(() => {
    const s = String(this.size());
    return STAR_SIZES[s] || STAR_SIZES[RatingSize.MD];
  });

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
    this.isDisabled.set(isDisabled);
  }

  setRating(val: number): void {
    if (this.effectiveDisabled() || this.readonly()) return;
    const next = this.allowClear() && this.rating() === val ? 0 : val;
    this.rating.set(next);
    this.onChange(next);
    this.ratingChange.emit(next);
  }

  onStarHover(val: number): void {
    if (!this.effectiveDisabled() && !this.readonly()) {
      this.hoverValue.set(val);
    }
  }

  onMouseLeave(): void {
    this.hoverValue.set(0);
  }
}
