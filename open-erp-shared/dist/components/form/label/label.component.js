var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
let LabelComponent = class LabelComponent {
    text = input('');
    forId = input(undefined);
    required = input(false);
    optional = input(false);
    tooltip = input(undefined);
    icon = input(undefined);
    loading = input(false);
};
LabelComponent = __decorate([
    Component({
        selector: 'erp-label',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './label.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], LabelComponent);
export { LabelComponent };
//# sourceMappingURL=label.component.js.map