var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../button/button.component';
import { ButtonSize } from '../../../enums/component.enum';
let SubmitButtonComponent = class SubmitButtonComponent {
    text = input('Lưu thông tin');
    size = input(ButtonSize.MD);
    submitting = input(false);
    disabled = input(false);
    icon = input('check');
    fullWidth = input(false);
    skeleton = input(false);
    submitClick = output();
};
SubmitButtonComponent = __decorate([
    Component({
        selector: 'erp-submit-button',
        standalone: true,
        imports: [CommonModule, ButtonComponent],
        templateUrl: './submit-button.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], SubmitButtonComponent);
export { SubmitButtonComponent };
//# sourceMappingURL=submit-button.component.js.map