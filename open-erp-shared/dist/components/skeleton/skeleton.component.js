var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
const SHAPE_CLASSES = {
    circle: 'rounded-full',
    pill: 'rounded-full',
    rect: 'rounded-none',
    rounded: 'rounded-xl'
};
let SkeletonComponent = class SkeletonComponent {
    width = input('100%');
    height = input('1rem');
    shape = input('rounded');
    className = input('');
    shapeClass = computed(() => {
        return SHAPE_CLASSES[this.shape()] || SHAPE_CLASSES['rounded'];
    });
};
SkeletonComponent = __decorate([
    Component({
        selector: 'erp-skeleton',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './skeleton.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], SkeletonComponent);
export { SkeletonComponent };
//# sourceMappingURL=skeleton.component.js.map