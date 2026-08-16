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
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
let TimePickerComponent = class TimePickerComponent {
    label;
    size = InputSize.MD;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    disabled = false;
    required = false;
    loading = false;
    valueChange = new EventEmitter();
    value = signal('');
    onChange = () => { };
    onTouched = () => { };
    writeValue(val) {
        this.value.set(val || '');
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
        const val = event.target.value;
        this.value.set(val);
        this.onChange(val);
        this.valueChange.emit(val);
    }
    setNow() {
        if (this.disabled)
            return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const time = `${hours}:${minutes}`;
        this.value.set(time);
        this.onChange(time);
        this.valueChange.emit(time);
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
};
__decorate([
    Input(),
    __metadata("design:type", String)
], TimePickerComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TimePickerComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TimePickerComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TimePickerComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TimePickerComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TimePickerComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TimePickerComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TimePickerComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TimePickerComponent.prototype, "valueChange", void 0);
TimePickerComponent = __decorate([
    Component({
        selector: 'erp-time-picker',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => TimePickerComponent),
                multi: true
            }
        ],
        templateUrl: './time-picker.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], TimePickerComponent);
export { TimePickerComponent };
//# sourceMappingURL=time-picker.component.js.map