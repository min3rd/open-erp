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
import { HelperTextComponent } from '../helper-text/helper-text.component';
let RadioGroupComponent = class RadioGroupComponent {
    label = input(undefined);
    options = input([]);
    orientation = input('vertical');
    cardMode = input(false);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    helperText = input(undefined);
    errorMessage = input(undefined);
    valueChange = output();
    selectedValue = signal(null);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    writeValue(val) {
        this.selectedValue.set(val);
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
    selectOption(opt) {
        if (this.effectiveDisabled() || opt.disabled)
            return;
        this.selectedValue.set(opt.value);
        this.onChange(opt.value);
        this.valueChange.emit(opt.value);
    }
    onKeyDown(event, opt) {
        if (this.effectiveDisabled() || opt.disabled)
            return;
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            this.selectOption(opt);
        }
        else if (['ArrowDown', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            this.selectNext(1);
        }
        else if (['ArrowUp', 'ArrowLeft'].includes(event.key)) {
            event.preventDefault();
            this.selectNext(-1);
        }
    }
    selectNext(direction) {
        const opts = this.options();
        if (opts.length === 0)
            return;
        const currentIdx = opts.findIndex(o => o.value === this.selectedValue());
        let nextIdx = currentIdx + direction;
        if (nextIdx < 0)
            nextIdx = opts.length - 1;
        if (nextIdx >= opts.length)
            nextIdx = 0;
        while (nextIdx !== currentIdx && opts[nextIdx].disabled) {
            nextIdx += direction;
            if (nextIdx < 0)
                nextIdx = opts.length - 1;
            if (nextIdx >= opts.length)
                nextIdx = 0;
        }
        if (!opts[nextIdx].disabled) {
            this.selectOption(opts[nextIdx]);
        }
    }
};
RadioGroupComponent = __decorate([
    Component({
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
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], RadioGroupComponent);
export { RadioGroupComponent };
//# sourceMappingURL=radio-group.component.js.map