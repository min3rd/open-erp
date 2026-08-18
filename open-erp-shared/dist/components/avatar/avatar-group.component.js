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
import { AvatarComponent } from './avatar.component';
import { AvatarSize, AvatarShape } from '../../enums/component.enum';
let AvatarGroupComponent = class AvatarGroupComponent {
    users = [];
    max = 4;
    size = AvatarSize.MD;
    shape = AvatarShape.CIRCLE;
    get visibleUsers() {
        return this.users.slice(0, this.max);
    }
    get remainingCount() {
        return Math.max(0, this.users.length - this.max);
    }
    getSizeClasses() {
        const s = String(this.size);
        switch (s) {
            case 'xs':
                return 'w-6 h-6 text-[10px] ring-1';
            case 'sm':
                return 'w-8 h-8 text-xs ring-2';
            case 'lg':
                return 'w-12 h-12 text-sm ring-2';
            case 'xl':
                return 'w-16 h-16 text-base ring-4';
            case 'md':
            default:
                return 'w-10 h-10 text-xs ring-2';
        }
    }
    getShapeClasses() {
        const sh = String(this.shape);
        switch (sh) {
            case 'circle':
                return 'rounded-full';
            case 'square':
                return 'rounded-none';
            case 'rounded':
            default:
                return 'rounded-xl';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], AvatarGroupComponent.prototype, "users", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], AvatarGroupComponent.prototype, "max", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AvatarGroupComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AvatarGroupComponent.prototype, "shape", void 0);
AvatarGroupComponent = __decorate([
    Component({
        selector: 'erp-avatar-group',
        standalone: true,
        imports: [CommonModule, AvatarComponent],
        templateUrl: './avatar-group.component.html',
        styles: [`
    :host {
      display: inline-flex;
    }
  `]
    })
], AvatarGroupComponent);
export { AvatarGroupComponent };
//# sourceMappingURL=avatar-group.component.js.map