var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { RatingSize } from '../../../enums/component.enum';
const STAR_SIZES = {
    [RatingSize.SM]: 16,
    [RatingSize.LG]: 28,
    [RatingSize.MD]: 22
};
let RatingComponent = class RatingComponent {
    label = input(undefined);
    max = input(5);
    size = input(RatingSize.MD);
    allowClear = input(true);
    readonly = input(false);
    disabled = input(false);
    loading = input(false);
    ratingChange = output();
    rating = signal(0);
    hoverValue = signal(0);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
    starSize = computed(() => {
        const s = String(this.size());
        return STAR_SIZES[s] || STAR_SIZES[RatingSize.MD];
    });
    writeValue(val) {
        this.rating.set(typeof val === 'number' ? val : 0);
    }
    registerOnChange(fn) {
        this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled) {
        this.isDisabled.set(isDisabled);
    }
    setRating(val) {
        if (this.effectiveDisabled() || this.readonly())
            return;
        const next = this.allowClear() && this.rating() === val ? 0 : val;
        this.rating.set(next);
        this.onChange(next);
        this.ratingChange.emit(next);
    }
    onStarHover(val) {
        if (!this.effectiveDisabled() && !this.readonly()) {
            this.hoverValue.set(val);
        }
    }
    onMouseLeave() {
        this.hoverValue.set(0);
    }
};
RatingComponent = __decorate([
    Component({
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
], RatingComponent);
export { RatingComponent };
//# sourceMappingURL=rating.component.js.map