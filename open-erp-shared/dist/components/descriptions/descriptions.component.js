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
import { IconComponent } from '../icon/icon.component';
import { DescriptionsLayout } from '../../enums/component.enum';
let DescriptionsComponent = class DescriptionsComponent {
    title;
    items = [];
    column = 3;
    bordered = true;
    layout = DescriptionsLayout.HORIZONTAL;
    size = 'md';
    getGridColsClasses() {
        switch (this.column) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-1 sm:grid-cols-2';
            case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
            case 3:
            default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        }
    }
    getSizeClasses() {
        switch (this.size) {
            case 'sm': return 'p-2.5 text-xs';
            case 'lg': return 'p-5 text-sm';
            case 'md':
            default: return 'p-3.5 text-xs';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], DescriptionsComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], DescriptionsComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], DescriptionsComponent.prototype, "column", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], DescriptionsComponent.prototype, "bordered", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DescriptionsComponent.prototype, "layout", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DescriptionsComponent.prototype, "size", void 0);
DescriptionsComponent = __decorate([
    Component({
        selector: 'erp-descriptions, erp-key-value',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './descriptions.component.html',
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