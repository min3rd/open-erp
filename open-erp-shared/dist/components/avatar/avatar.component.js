var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarSize, AvatarShape } from '../../enums/component.enum';
import { SkeletonComponent } from '../skeleton/skeleton.component';
const SIZE_CLASSES = {
    [AvatarSize.XS]: 'w-6 h-6 text-[10px]',
    [AvatarSize.SM]: 'w-8 h-8 text-xs',
    [AvatarSize.LG]: 'w-12 h-12 text-lg',
    [AvatarSize.XL]: 'w-16 h-16 text-2xl',
    [AvatarSize.MD]: 'w-10 h-10 text-sm'
};
let AvatarComponent = class AvatarComponent {
    name = input('User');
    size = input(AvatarSize.MD);
    shape = input(AvatarShape.ROUNDED);
    online = input(false);
    imageUrl = input(undefined);
    loading = input(false);
    initial = computed(() => {
        const val = (this.name() || 'U').trim();
        return val.length > 0 ? val[0].toUpperCase() : 'U';
    });
    sizeClass = computed(() => {
        const s = String(this.size());
        return SIZE_CLASSES[s] || SIZE_CLASSES[AvatarSize.MD];
    });
    shapeClass = computed(() => {
        const sh = String(this.shape());
        const sz = String(this.size());
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
    });
};
AvatarComponent = __decorate([
    Component({
        selector: 'erp-avatar',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        templateUrl: './avatar.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], AvatarComponent);
export { AvatarComponent };
//# sourceMappingURL=avatar.component.js.map