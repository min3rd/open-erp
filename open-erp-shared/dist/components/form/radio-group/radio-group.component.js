var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
let RadioGroupComponent = class RadioGroupComponent {
    label;
    options = [];
    orientation = 'vertical';
    cardMode = false;
    disabled = false;
    required = false;
    loading = false;
    helperText;
    errorMessage;
    valueChange = new EventEmitter();
    selectedValue = signal(null);
    onChange = () => { };
    onTouched = () => { };
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
        this.disabled = isDisabled;
    }
    selectOption(opt) {
        if (this.disabled || opt.disabled)
            return;
        this.selectedValue.set(opt.value);
        this.onChange(opt.value);
        this.valueChange.emit(opt.value);
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], RadioGroupComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], RadioGroupComponent.prototype, "options", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], RadioGroupComponent.prototype, "orientation", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RadioGroupComponent.prototype, "cardMode", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RadioGroupComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RadioGroupComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RadioGroupComponent.prototype, "loading", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], RadioGroupComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], RadioGroupComponent.prototype, "errorMessage", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], RadioGroupComponent.prototype, "valueChange", void 0);
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