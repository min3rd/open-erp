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
let CheckboxComponent = class CheckboxComponent {
    label = '';
    description;
    indeterminate = false;
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
], CheckboxComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], CheckboxComponent.prototype, "description", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CheckboxComponent.prototype, "indeterminate", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CheckboxComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CheckboxComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], CheckboxComponent.prototype, "checkedChange", void 0);
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
        templateUrl: './checkbox.component.html'
    })
], CheckboxComponent);
export { CheckboxComponent };
//# sourceMappingURL=checkbox.component.js.map