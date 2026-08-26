var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from './avatar.component';
import { AvatarSize, AvatarShape } from '../../enums/component.enum';
const GROUP_SIZE_CLASSES = {
    [AvatarSize.XS]: 'w-6 h-6 text-[10px] ring-1',
    [AvatarSize.SM]: 'w-8 h-8 text-xs ring-2',
    [AvatarSize.LG]: 'w-12 h-12 text-sm ring-2',
    [AvatarSize.XL]: 'w-16 h-16 text-base ring-4',
    [AvatarSize.MD]: 'w-10 h-10 text-xs ring-2'
};
let AvatarGroupComponent = class AvatarGroupComponent {
    users = input([]);
    max = input(4);
    size = input(AvatarSize.MD);
    shape = input(AvatarShape.CIRCLE);
    visibleUsers = computed(() => {
        return this.users().slice(0, this.max());
    });
    remainingCount = computed(() => {
        return Math.max(0, this.users().length - this.max());
    });
    sizeClass = computed(() => {
        const s = String(this.size());
        return GROUP_SIZE_CLASSES[s] || GROUP_SIZE_CLASSES[AvatarSize.MD];
    });
    shapeClass = computed(() => {
        const sh = String(this.shape());
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
                return 'rounded-xl';
        }
    });
};
AvatarGroupComponent = __decorate([
    Component({
        selector: 'erp-avatar-group',
        standalone: true,
        imports: [CommonModule, AvatarComponent],
        templateUrl: './avatar-group.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: inline-flex;
    }
  `]
    })
], AvatarGroupComponent);
export { AvatarGroupComponent };
//# sourceMappingURL=avatar-group.component.js.map