var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { ValidationStatus } from '../../../enums/component.enum';
let HelperTextComponent = class HelperTextComponent {
    text = '';
    status = ValidationStatus.NONE;
    getTextClasses() {
        const st = String(this.status);
        switch (st) {
            case ValidationStatus.INVALID:
            case 'invalid':
                return 'text-rose-500 dark:text-rose-400';
            case ValidationStatus.VALID:
            case 'valid':
                return 'text-emerald-600 dark:text-emerald-400';
            case ValidationStatus.WARNING:
            case 'warning':
                return 'text-amber-600 dark:text-amber-400';
            case ValidationStatus.NONE:
            case 'none':
            default:
                return 'text-slate-400 dark:text-slate-500';
        }
    }
    getIconName() {
        const st = String(this.status);
        switch (st) {
            case ValidationStatus.INVALID:
            case 'invalid':
                return 'alert-circle';
            case ValidationStatus.VALID:
            case 'valid':
                return 'check-circle';
            case ValidationStatus.WARNING:
            case 'warning':
                return 'alert-triangle';
            default:
                return 'info';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], HelperTextComponent.prototype, "text", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], HelperTextComponent.prototype, "status", void 0);
HelperTextComponent = __decorate([
    Component({
        selector: 'erp-helper-text',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './helper-text.component.html'
    })
], HelperTextComponent);
export { HelperTextComponent };
//# sourceMappingURL=helper-text.component.js.map