var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
let InputComponent = class InputComponent {
    label;
    placeholder = '';
    type = 'text';
    size = InputSize.MD;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    prefixIcon;
    suffixIcon;
    clearable = false;
    disabled = false;
    readonly = false;
    required = false;
    loading = false;
    valueChange = new EventEmitter();
    clear = new EventEmitter();
    value = '';
    onChange = () => { };
    onTouched = () => { };
    writeValue(val) {
        this.value = val !== undefined && val !== null ? String(val) : '';
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
    onInput(event) {
        const val = event.target.value;
        this.value = val;
        this.onChange(val);
        this.valueChange.emit(val);
    }
    onClear() {
        this.value = '';
        this.onChange('');
        this.valueChange.emit('');
        this.clear.emit();
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
        if (st === ValidationStatus.WARNING || st === 'warning') {
            return 'border-amber-500 focus:ring-amber-500/30 text-amber-900 dark:text-amber-100';
        }
        return 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white';
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "type", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "prefixIcon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], InputComponent.prototype, "suffixIcon", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], InputComponent.prototype, "clearable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], InputComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], InputComponent.prototype, "readonly", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], InputComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], InputComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], InputComponent.prototype, "valueChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], InputComponent.prototype, "clear", void 0);
InputComponent = __decorate([
    Component({
        selector: 'erp-input',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => InputComponent),
                multi: true
            }
        ],
        templateUrl: './input.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], InputComponent);
export { InputComponent };
//# sourceMappingURL=input.component.js.map