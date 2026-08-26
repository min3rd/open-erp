var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { DescriptionsLayout } from '../../enums/component.enum';
const SIZE_CLASSES = {
    sm: 'p-2.5 text-xs',
    lg: 'p-5 text-sm',
    md: 'p-3.5 text-xs'
};
let DescriptionsComponent = class DescriptionsComponent {
    title = input(undefined);
    items = input([]);
    column = input(3);
    bordered = input(true);
    layout = input(DescriptionsLayout.HORIZONTAL);
    size = input('md');
    gridColsClass = computed(() => {
        switch (this.column()) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-1 sm:grid-cols-2';
            case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
            case 3:
            default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        }
    });
    sizeClass = computed(() => {
        return SIZE_CLASSES[this.size()] || SIZE_CLASSES['md'];
    });
};
DescriptionsComponent = __decorate([
    Component({
        selector: 'erp-descriptions, erp-key-value',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './descriptions.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], DescriptionsComponent);
export { DescriptionsComponent };
//# sourceMappingURL=descriptions.component.js.map