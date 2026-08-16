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
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { InputSize } from '../../../enums/component.enum';
let SwitchComponent = class SwitchComponent {
    label;
    description;
    size = InputSize.MD;
    disabled = false;
    loading = false;
    checkedChange = new EventEmitter();
    checked = signal(false);
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
        this.disabled = isDisabled;
    }
    toggle() {
        if (this.disabled)
            return;
        const next = !this.checked();
        this.checked.set(next);
        this.onChange(next);
        this.checkedChange.emit(next);
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], SwitchComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SwitchComponent.prototype, "description", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SwitchComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SwitchComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SwitchComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SwitchComponent.prototype, "checkedChange", void 0);
SwitchComponent = __decorate([
    Component({
        selector: 'erp-switch',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => SwitchComponent),
                multi: true
            }
        ],
        templateUrl: './switch.component.html'
    })
], SwitchComponent);
export { SwitchComponent };
//# sourceMappingURL=switch.component.js.map