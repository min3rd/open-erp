var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';
let OtpInputComponent = class OtpInputComponent {
    label = input('Mã xác thực OTP');
    length = input(6);
    status = input(ValidationStatus.NONE);
    helperText = input(undefined);
    errorMessage = input(undefined);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    completed = output();
    valueChange = output();
    inputElements;
    digits = signal([]);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    slots = computed(() => Array.from({ length: this.length() }, (_, i) => i));
    ngOnInit() {
        this.digits.set(new Array(this.length()).fill(''));
    }
    writeValue(val) {
        const len = this.length();
        const str = String(val || '');
        const arr = new Array(len).fill('');
        for (let i = 0; i < len && i < str.length; i++) {
            arr[i] = str[i];
        }
        this.digits.set(arr);
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
    onDigitInput(event, index) {
        const input = event.target;
        const val = input.value.slice(-1);
        const len = this.length();
        const arr = [...this.digits()];
        arr[index] = val;
        this.digits.set(arr);
        const fullCode = arr.join('');
        this.onChange(fullCode);
        this.valueChange.emit(fullCode);
        if (val && index < len - 1) {
            const el = this.inputElements.get(index + 1);
            el?.nativeElement.focus();
        }
        if (fullCode.length === len && !arr.includes('')) {
            this.completed.emit(fullCode);
        }
    }
    onKeyDown(event, index) {
        if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
            const el = this.inputElements.get(index - 1);
            el?.nativeElement.focus();
        }
    }
    onPaste(event) {
        event.preventDefault();
        const len = this.length();
        const clipboardData = event.clipboardData?.getData('text') || '';
        const clean = clipboardData.replace(/\D/g, '').slice(0, len);
        if (!clean)
            return;
        const arr = new Array(len).fill('');
        for (let i = 0; i < clean.length; i++) {
            arr[i] = clean[i];
        }
        this.digits.set(arr);
        const fullCode = arr.join('');
        this.onChange(fullCode);
        this.valueChange.emit(fullCode);
        if (clean.length === len) {
            this.completed.emit(fullCode);
        }
    }
};
__decorate([
    ViewChildren('otpInput'),
    __metadata("design:type", QueryList)
], OtpInputComponent.prototype, "inputElements", void 0);
OtpInputComponent = __decorate([
    Component({
        selector: 'erp-otp-input',
        standalone: true,
        imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => OtpInputComponent),
                multi: true
            }
        ],
        templateUrl: './otp-input.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], OtpInputComponent);
export { OtpInputComponent };
//# sourceMappingURL=otp-input.component.js.map