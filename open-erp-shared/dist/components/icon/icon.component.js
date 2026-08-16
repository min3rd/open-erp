var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
export const provideSharedIcons = () => importProvidersFrom(FeatherModule.pick(allIcons));
let IconComponent = class IconComponent {
    name = 'info';
    size = 18;
    strokeWidth = 2;
    className = '';
};
__decorate([
    Input(),
    __metadata("design:type", String)
], IconComponent.prototype, "name", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], IconComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], IconComponent.prototype, "strokeWidth", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], IconComponent.prototype, "className", void 0);
IconComponent = __decorate([
    Component({
        selector: 'erp-icon',
        standalone: true,
        imports: [CommonModule, FeatherModule],
        templateUrl: './icon.component.html',
        styleUrls: ['./icon.component.css']
    })
], IconComponent);
export { IconComponent };
//# sourceMappingURL=icon.component.js.map