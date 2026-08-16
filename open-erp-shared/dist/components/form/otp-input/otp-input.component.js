var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';
let OtpInputComponent = class OtpInputComponent {
    label = 'Mã xác thực OTP';
    length = 6;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    disabled = false;
    required = false;
    loading = false;
    completed = new EventEmitter();
    valueChange = new EventEmitter();
    inputElements;
    digits = signal([]);
    onChange = () => { };
    onTouched = () => { };
    slots = computed(() => Array.from({ length: this.length }, (_, i) => i));
    ngOnInit() {
        this.digits.set(new Array(this.length).fill(''));
    }
    writeValue(val) {
        const str = String(val || '');
        const arr = new Array(this.length).fill('');
        for (let i = 0; i < this.length && i < str.length; i++) {
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
        this.disabled = isDisabled;
    }
    onDigitInput(event, index) {
        const input = event.target;
        const val = input.value.slice(-1);
        const arr = [...this.digits()];
        arr[index] = val;
        this.digits.set(arr);
        const fullCode = arr.join('');
        this.onChange(fullCode);
        this.valueChange.emit(fullCode);
        if (val && index < this.length - 1) {
            const el = this.inputElements.get(index + 1);
            el?.nativeElement.focus();
        }
        if (fullCode.length === this.length && !arr.includes('')) {
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
        const clipboardData = event.clipboardData?.getData('text') || '';
        const clean = clipboardData.replace(/\D/g, '').slice(0, this.length);
        if (!clean)
            return;
        const arr = new Array(this.length).fill('');
        for (let i = 0; i < clean.length; i++) {
            arr[i] = clean[i];
        }
        this.digits.set(arr);
        const fullCode = arr.join('');
        this.onChange(fullCode);
        this.valueChange.emit(fullCode);
        if (clean.length === this.length) {
            this.completed.emit(fullCode);
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], OtpInputComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], OtpInputComponent.prototype, "length", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], OtpInputComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], OtpInputComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], OtpInputComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], OtpInputComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], OtpInputComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], OtpInputComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], OtpInputComponent.prototype, "completed", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], OtpInputComponent.prototype, "valueChange", void 0);
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