var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { DividerOrientation } from '../../enums/component.enum';
let DividerComponent = class DividerComponent {
    orientation = input(DividerOrientation.HORIZONTAL);
    dashed = input(false);
    label = input(undefined);
    align = input('center');
    loading = input(false);
};
DividerComponent = __decorate([
    Component({
        selector: 'erp-divider',
        standalone: true,
        imports: [CommonModule, SkeletonComponent],
        templateUrl: './divider.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], DividerComponent);
export { DividerComponent };
//# sourceMappingURL=divider.component.js.map