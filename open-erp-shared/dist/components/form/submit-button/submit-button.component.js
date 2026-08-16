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
let SubmitButtonComponent = class SubmitButtonComponent {
    text = 'Lưu thông tin';
    size = ButtonSize.MD;
    submitting = false;
    disabled = false;
    icon = 'check';
    fullWidth = false;
    skeleton = false;
    submitClick = new EventEmitter();
};
__decorate([
    Input(),
    __metadata("design:type", String)
], SubmitButtonComponent.prototype, "text", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SubmitButtonComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SubmitButtonComponent.prototype, "submitting", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SubmitButtonComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SubmitButtonComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SubmitButtonComponent.prototype, "fullWidth", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SubmitButtonComponent.prototype, "skeleton", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SubmitButtonComponent.prototype, "submitClick", void 0);
SubmitButtonComponent = __decorate([
    Component({
        selector: 'erp-submit-button',
        standalone: true,
        imports: [CommonModule, ButtonComponent],
        templateUrl: './submit-button.component.html'
    })
], SubmitButtonComponent);
export { SubmitButtonComponent };
//# sourceMappingURL=submit-button.component.js.map