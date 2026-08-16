var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { RatingSize } from '../../../enums/component.enum';
let RatingComponent = class RatingComponent {
    label;
    max = 5;
    size = RatingSize.MD;
    allowClear = true;
    readonly = false;
    disabled = false;
    loading = false;
    ratingChange = new EventEmitter();
    rating = signal(0);
    hoverValue = signal(0);
    onChange = () => { };
    onTouched = () => { };
    stars = computed(() => Array.from({ length: this.max }, (_, i) => i + 1));
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
        this.disabled = isDisabled;
    }
    setRating(val) {
        if (this.disabled || this.readonly)
            return;
        const next = this.allowClear && this.rating() === val ? 0 : val;
        this.rating.set(next);
        this.onChange(next);
        this.ratingChange.emit(next);
    }
    onStarHover(val) {
        if (!this.disabled && !this.readonly) {
            this.hoverValue.set(val);
        }
    }
    onMouseLeave() {
        this.hoverValue.set(0);
    }
    getStarSize() {
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
};
__decorate([
    Input(),
    __metadata("design:type", String)
], RatingComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], RatingComponent.prototype, "max", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], RatingComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RatingComponent.prototype, "allowClear", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RatingComponent.prototype, "readonly", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RatingComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RatingComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], RatingComponent.prototype, "ratingChange", void 0);
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