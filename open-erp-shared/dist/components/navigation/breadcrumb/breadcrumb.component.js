var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { BreadcrumbSeparator } from '../../../enums/component.enum';
let BreadcrumbComponent = class BreadcrumbComponent {
    items = input([]);
    separator = input(BreadcrumbSeparator.CHEVRON);
    maxItems = input(undefined);
    showHomeIcon = input(false);
    homeIcon = input('home');
    homeUrl = input('/');
    loading = input(false);
    itemClick = output();
    isExpandedCollapsed = signal(false);
    normalizedItems = computed(() => {
        const raw = this.items();
        return raw.map((item, idx) => {
            if (typeof item === 'string') {
                return { label: item, active: idx === raw.length - 1 };
            }
            return {
                ...item,
                active: item.active !== undefined ? item.active : idx === raw.length - 1
            };
        });
    });
    displayItems = computed(() => {
        const all = this.normalizedItems();
        const max = this.maxItems();
        if (!max || all.length <= max || this.isExpandedCollapsed()) {
            return all.map((item, idx) => ({ item, originalIndex: idx }));
        }
        const first = all.slice(0, 1);
        const last = all.slice(-(max - 1));
        return [
            { item: first[0], originalIndex: 0 },
            { item: { label: '...' }, isEllipsis: true, originalIndex: -1 },
            ...last.map((item, i) => ({ item, originalIndex: all.length - last.length + i }))
        ];
    });
    onItemClick(item, event) {
        if (item.disabled || item.active) {
            event.preventDefault();
            return;
        }
        this.itemClick.emit(item);
    }
    expandEllipsis() {
        this.isExpandedCollapsed.set(true);
    }
};
BreadcrumbComponent = __decorate([
    Component({
        selector: 'erp-breadcrumb',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './breadcrumb.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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