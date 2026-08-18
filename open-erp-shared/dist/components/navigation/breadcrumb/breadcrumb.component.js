var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { BreadcrumbSeparator } from '../../../enums/component.enum';
let BreadcrumbComponent = class BreadcrumbComponent {
    items = [];
    separator = BreadcrumbSeparator.CHEVRON;
    maxItems;
    showHomeIcon = false;
    homeIcon = 'home';
    homeUrl = '/';
    loading = false;
    itemClick = new EventEmitter();
    isExpandedCollapsed = false;
    get normalizedItems() {
        const list = this.items.map((item, idx) => {
            if (typeof item === 'string') {
                return { label: item, active: idx === this.items.length - 1 };
            }
            return {
                ...item,
                active: item.active !== undefined ? item.active : idx === this.items.length - 1
            };
        });
        return list;
    }
    get displayItems() {
        const all = this.normalizedItems;
        if (!this.maxItems || all.length <= this.maxItems || this.isExpandedCollapsed) {
            return all.map((item, idx) => ({ item, originalIndex: idx }));
        }
        const first = all.slice(0, 1);
        const last = all.slice(-(this.maxItems - 1));
        return [
            { item: first[0], originalIndex: 0 },
            { item: { label: '...' }, isEllipsis: true, originalIndex: -1 },
            ...last.map((item, i) => ({ item, originalIndex: all.length - last.length + i }))
        ];
    }
    onItemClick(item, event) {
        if (item.disabled || item.active) {
            event.preventDefault();
            return;
        }
        this.itemClick.emit(item);
    }
    expandEllipsis() {
        this.isExpandedCollapsed = true;
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], BreadcrumbComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BreadcrumbComponent.prototype, "separator", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], BreadcrumbComponent.prototype, "maxItems", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BreadcrumbComponent.prototype, "showHomeIcon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BreadcrumbComponent.prototype, "homeIcon", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BreadcrumbComponent.prototype, "homeUrl", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BreadcrumbComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BreadcrumbComponent.prototype, "itemClick", void 0);
BreadcrumbComponent = __decorate([
    Component({
        selector: 'erp-breadcrumb',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './breadcrumb.component.html',
        styles: [`
    :host {
      display: inline-block;
      max-width: 100%;
    }
  `]
    })
], BreadcrumbComponent);
export { BreadcrumbComponent };
//# sourceMappingURL=breadcrumb.component.js.map