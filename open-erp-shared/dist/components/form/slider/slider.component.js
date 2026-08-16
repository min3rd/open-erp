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
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
let SliderComponent = class SliderComponent {
    label;
    min = 0;
    max = 100;
    step = 1;
    showValue = true;
    unit;
    disabled = false;
    loading = false;
    helperText;
    valueChange = new EventEmitter();
    value = signal(0);
    onChange = () => { };
    onTouched = () => { };
    percentage = computed(() => {
        const range = this.max - this.min;
        if (range <= 0)
            return 0;
        return ((this.value() - this.min) / range) * 100;
    });
    writeValue(val) {
        this.value.set(typeof val === 'number' ? val : this.min);
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
    onSliderInput(event) {
        const val = Number(event.target.value);
        this.value.set(val);
        this.onChange(val);
        this.valueChange.emit(val);
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], SliderComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], SliderComponent.prototype, "min", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], SliderComponent.prototype, "max", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], SliderComponent.prototype, "step", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SliderComponent.prototype, "showValue", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SliderComponent.prototype, "unit", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SliderComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SliderComponent.prototype, "loading", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SliderComponent.prototype, "helperText", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SliderComponent.prototype, "valueChange", void 0);
SliderComponent = __decorate([
    Component({
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
], SliderComponent);
export { SliderComponent };
//# sourceMappingURL=slider.component.js.map