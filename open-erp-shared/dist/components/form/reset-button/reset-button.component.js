var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../button/button.component';
import { ButtonSize } from '../../../enums/component.enum';
let ResetButtonComponent = class ResetButtonComponent {
    text = 'Hủy bỏ / Đặt lại';
    size = ButtonSize.MD;
    disabled = false;
    icon = 'refresh-cw';
    fullWidth = false;
    skeleton = false;
    resetClick = new EventEmitter();
};
__decorate([
    Input(),
    __metadata("design:type", String)
], ResetButtonComponent.prototype, "text", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ResetButtonComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ResetButtonComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ResetButtonComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ResetButtonComponent.prototype, "fullWidth", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ResetButtonComponent.prototype, "skeleton", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ResetButtonComponent.prototype, "resetClick", void 0);
ResetButtonComponent = __decorate([
    Component({
        selector: 'erp-reset-button',
        standalone: true,
        imports: [CommonModule, ButtonComponent],
        templateUrl: './reset-button.component.html'
    })
], ResetButtonComponent);
export { ResetButtonComponent };
//# sourceMappingURL=reset-button.component.js.map