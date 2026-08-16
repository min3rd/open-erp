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
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
let NumberInputComponent = class NumberInputComponent {
    label;
    placeholder = '0';
    min = -Infinity;
    max = Infinity;
    step = 1;
    prefix;
    suffix;
    size = InputSize.MD;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    disabled = false;
    required = false;
    loading = false;
    valueChange = new EventEmitter();
    value = signal(null);
    onChange = () => { };
    onTouched = () => { };
    writeValue(val) {
        const num = typeof val === 'number' ? val : (val !== null && val !== undefined && val !== '' ? Number(val) : null);
        this.value.set(num);
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
    onInputChange(event) {
        const raw = event.target.value;
        const val = raw === '' ? null : Number(raw);
        this.updateValue(val);
    }
    increment() {
        if (this.disabled)
            return;
        const cur = this.value() ?? 0;
        const next = Math.min(this.max, cur + this.step);
        this.updateValue(next);
    }
    decrement() {
        if (this.disabled)
            return;
        const cur = this.value() ?? 0;
        const next = Math.max(this.min, cur - this.step);
        this.updateValue(next);
    }
    updateValue(val) {
        this.value.set(val);
        this.onChange(val);
        this.valueChange.emit(val);
    }
    getSizeClasses() {
        const s = String(this.size);
        switch (s) {
            case InputSize.SM:
            case 'sm':
                return 'py-1.5 px-3 text-xs rounded-xl';
            case InputSize.LG:
            case 'lg':
                return 'py-3 px-4 text-sm rounded-2xl';
            case InputSize.MD:
            case 'md':
            default:
                return 'py-2.5 px-3.5 text-xs rounded-xl';
        }
    }
    getStatusClasses() {
        const st = String(this.status);
        if (this.errorMessage || st === ValidationStatus.INVALID || st === 'invalid') {
            return 'border-rose-500 focus:ring-rose-500/30 text-rose-900 dark:text-rose-100';
        }
        if (st === ValidationStatus.VALID || st === 'valid') {
            return 'border-emerald-500 focus:ring-emerald-500/30 text-emerald-900 dark:text-emerald-100';
        }
        return 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white';
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], NumberInputComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NumberInputComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], NumberInputComponent.prototype, "min", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], NumberInputComponent.prototype, "max", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], NumberInputComponent.prototype, "step", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NumberInputComponent.prototype, "prefix", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NumberInputComponent.prototype, "suffix", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NumberInputComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NumberInputComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NumberInputComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NumberInputComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], NumberInputComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], NumberInputComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], NumberInputComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], NumberInputComponent.prototype, "valueChange", void 0);
NumberInputComponent = __decorate([
    Component({
        selector: 'erp-number-input',
        standalone: true,
        imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => NumberInputComponent),
                multi: true
            }
        ],
        templateUrl: './number-input.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], NumberInputComponent);
export { NumberInputComponent };
//# sourceMappingURL=number-input.component.js.map