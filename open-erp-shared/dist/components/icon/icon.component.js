var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
export const provideSharedIcons = () => importProvidersFrom(FeatherModule.pick(allIcons));
let IconComponent = class IconComponent {
    name = input('info');
    size = input(18);
    strokeWidth = input(2);
    className = input('');
};
IconComponent = __decorate([
    Component({
        selector: 'erp-icon',
        standalone: true,
        imports: [CommonModule, FeatherModule],
        templateUrl: './icon.component.html',
        styleUrls: ['./icon.component.css'],
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], IconComponent);
export { IconComponent };
//# sourceMappingURL=icon.component.js.map