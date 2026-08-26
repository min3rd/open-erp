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
let ResetButtonComponent = class ResetButtonComponent {
    text = input('Hủy bỏ / Đặt lại');
    size = input(ButtonSize.MD);
    disabled = input(false);
    icon = input('refresh-cw');
    fullWidth = input(false);
    skeleton = input(false);
    resetClick = output();
};
ResetButtonComponent = __decorate([
    Component({
        selector: 'erp-reset-button',
        standalone: true,
        imports: [CommonModule, ButtonComponent],
        templateUrl: './reset-button.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], ResetButtonComponent);
export { ResetButtonComponent };
//# sourceMappingURL=reset-button.component.js.map