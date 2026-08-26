var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
const SIZE_CLASSES = {
    [InputSize.SM]: 'py-1.5 px-3 text-xs rounded-xl',
    [InputSize.LG]: 'py-3 px-4 text-sm rounded-2xl',
    [InputSize.MD]: 'py-2.5 px-3.5 text-xs rounded-xl'
};
let PasswordInputComponent = class PasswordInputComponent {
    label = input('Mật khẩu');
    placeholder = input('••••••••');
    size = input(InputSize.MD);
    status = input(ValidationStatus.NONE);
    helperText = input(undefined);
    errorMessage = input(undefined);
    showStrengthMeter = input(false);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    valueChange = output();
    value = signal('');
    showPassword = signal(false);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    sizeClass = computed(() => {
        const s = String(this.size());
        return SIZE_CLASSES[s] || SIZE_CLASSES[InputSize.MD];
    });
    statusClass = computed(() => {
        const err = this.errorMessage();
        const st = String(this.status());
        if (err || st === ValidationStatus.INVALID || st === 'invalid') {
            return 'border-rose-500 focus:ring-rose-500/30 text-rose-900 dark:text-rose-100';
        }
        if (st === ValidationStatus.VALID || st === 'valid') {
            return 'border-emerald-500 focus:ring-emerald-500/30 text-emerald-900 dark:text-emerald-100';
        }
        return 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white';
    });
    iconSize = computed(() => (this.size() === 'sm' ? 14 : 16));
    skeletonHeight = computed(() => {
        const s = String(this.size());
        return s === 'lg' ? '2.875rem' : (s === 'sm' ? '2rem' : '2.5rem');
    });
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
        this.isDisabled.set(isDisabled);
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
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
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