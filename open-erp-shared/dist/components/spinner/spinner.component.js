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
import { SpinnerSize, SpinnerVariant } from '../../enums/component.enum';
let SpinnerComponent = class SpinnerComponent {
    size = SpinnerSize.MD;
    variant = SpinnerVariant.SPIN;
    color = 'text-indigo-600 dark:text-indigo-400';
    label;
    getSizeClasses() {
        const s = String(this.size);
        switch (s) {
            case 'xs': return 'w-3 h-3';
            case 'sm': return 'w-4 h-4';
            case 'lg': return 'w-8 h-8';
            case 'xl': return 'w-12 h-12';
            case 'md':
            default: return 'w-6 h-6';
        }
    }
    getDotSizeClasses() {
        const s = String(this.size);
        switch (s) {
            case 'xs': return 'w-1 h-1';
            case 'sm': return 'w-1.5 h-1.5';
            case 'lg': return 'w-3 h-3';
            case 'xl': return 'w-4 h-4';
            case 'md':
            default: return 'w-2 h-2';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], SpinnerComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SpinnerComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SpinnerComponent.prototype, "color", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SpinnerComponent.prototype, "label", void 0);
SpinnerComponent = __decorate([
    Component({
        selector: 'erp-spinner, erp-loader',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './spinner.component.html'
    })
], SpinnerComponent);
export { SpinnerComponent };
//# sourceMappingURL=spinner.component.js.map