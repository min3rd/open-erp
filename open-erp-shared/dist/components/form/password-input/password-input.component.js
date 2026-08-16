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
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
let PasswordInputComponent = class PasswordInputComponent {
    label = 'Mật khẩu';
    placeholder = '••••••••';
    size = InputSize.MD;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    showStrengthMeter = false;
    disabled = false;
    required = false;
    loading = false;
    valueChange = new EventEmitter();
    value = signal('');
    showPassword = signal(false);
    onChange = () => { };
    onTouched = () => { };
    passwordStrength = computed(() => {
        const val = this.value();
        if (!val)
            return 0;
        let score = 0;
        if (val.length >= 8)
            score += 25;
        if (/[A-Z]/.test(val))
            score += 25;
        if (/[0-9]/.test(val))
            score += 25;
        if (/[^A-Za-z0-9]/.test(val))
            score += 25;
        return score;
    });
    strengthLabel = computed(() => {
        const s = this.passwordStrength();
        if (s <= 25)
            return 'Rất yếu';
        if (s <= 50)
            return 'Trung bình';
        if (s <= 75)
            return 'Khá';
        return 'Rất mạnh';
    });
    strengthColor = computed(() => {
        const s = this.passwordStrength();
        if (s <= 25)
            return 'bg-rose-500';
        if (s <= 50)
            return 'bg-amber-500';
        if (s <= 75)
            return 'bg-indigo-500';
        return 'bg-emerald-500';
    });
    writeValue(val) {
        this.value.set(val !== undefined && val !== null ? String(val) : '');
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
    togglePasswordVisibility() {
        this.showPassword.update(prev => !prev);
    }
    onInput(event) {
        const val = event.target.value;
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
], PasswordInputComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PasswordInputComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PasswordInputComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PasswordInputComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PasswordInputComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PasswordInputComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PasswordInputComponent.prototype, "showStrengthMeter", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PasswordInputComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PasswordInputComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PasswordInputComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], PasswordInputComponent.prototype, "valueChange", void 0);
PasswordInputComponent = __decorate([
    Component({
        selector: 'erp-password-input',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => PasswordInputComponent),
                multi: true
            }
        ],
        templateUrl: './password-input.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], PasswordInputComponent);
export { PasswordInputComponent };
//# sourceMappingURL=password-input.component.js.map