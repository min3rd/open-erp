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
import { AvatarSize, AvatarShape } from '../../enums/component.enum';
import { SkeletonComponent } from '../skeleton/skeleton.component';
let AvatarComponent = class AvatarComponent {
    name = 'User';
    size = AvatarSize.MD;
    shape = AvatarShape.ROUNDED;
    online = false;
    imageUrl;
    loading = false;
    get initial() {
        const val = (this.name || 'U').trim();
        return val.length > 0 ? val[0].toUpperCase() : 'U';
    }
    getSizeClasses() {
        const s = String(this.size);
        switch (s) {
            case AvatarSize.XS:
            case 'xs':
                return 'w-6 h-6 text-[10px]';
            case AvatarSize.SM:
            case 'sm':
                return 'w-8 h-8 text-xs';
            case AvatarSize.LG:
            case 'lg':
                return 'w-12 h-12 text-lg';
            case AvatarSize.XL:
            case 'xl':
                return 'w-16 h-16 text-2xl';
            case AvatarSize.MD:
            case 'md':
            default:
                return 'w-10 h-10 text-sm';
        }
    }
    getShapeClasses() {
        const sh = String(this.shape);
        const sz = String(this.size);
        switch (sh) {
            case AvatarShape.CIRCLE:
            case 'circle':
                return 'rounded-full';
            case AvatarShape.SQUARE:
            case 'square':
                return 'rounded-none';
            case AvatarShape.ROUNDED:
            case 'rounded':
            default:
                return sz === AvatarSize.XL || sz === 'xl' ? 'rounded-2xl' : 'rounded-xl';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], AvatarComponent.prototype, "name", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AvatarComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AvatarComponent.prototype, "shape", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AvatarComponent.prototype, "online", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AvatarComponent.prototype, "imageUrl", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AvatarComponent.prototype, "loading", void 0);
AvatarComponent = __decorate([
    Component({
        selector: 'erp-avatar',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        templateUrl: './avatar.component.html'
    })
], AvatarComponent);
export { AvatarComponent };
//# sourceMappingURL=avatar.component.js.map