var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
let CheckboxComponent = class CheckboxComponent {
    label = input('');
    description = input(undefined);
    indeterminate = input(false);
    disabled = input(false);
    loading = input(false);
    checkedChange = output();
    checked = signal(false);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    writeValue(val) {
        this.checked.set(Boolean(val));
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
    toggle() {
        if (this.disabled() || this.isDisabled())
            return;
        const next = !this.checked();
        this.checked.set(next);
        this.onChange(next);
        this.checkedChange.emit(next);
        this.onTouched();
    }
    onKeyDown(event) {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            this.toggle();
        }
    }
};
CheckboxComponent = __decorate([
    Component({
        selector: 'erp-checkbox',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => CheckboxComponent),
                multi: true
            }
        ],
        templateUrl: './checkbox.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], CheckboxComponent);
export { CheckboxComponent };
//# sourceMappingURL=checkbox.component.js.map