var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
let SliderComponent = class SliderComponent {
    label = input(undefined);
    min = input(0);
    max = input(100);
    step = input(1);
    showValue = input(true);
    unit = input(undefined);
    disabled = input(false);
    loading = input(false);
    helperText = input(undefined);
    valueChange = output();
    value = signal(0);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    percentage = computed(() => {
        const mn = this.min();
        const mx = this.max();
        const range = mx - mn;
        if (range <= 0)
            return 0;
        return ((this.value() - mn) / range) * 100;
    });
    writeValue(val) {
        this.value.set(typeof val === 'number' ? val : this.min());
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
    onSliderInput(event) {
        const val = Number(event.target.value);
        this.value.set(val);
        this.onChange(val);
        this.valueChange.emit(val);
    }
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
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