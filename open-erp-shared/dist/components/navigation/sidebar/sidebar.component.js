var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SidebarMode } from '../../../enums/component.enum';
let SidebarComponent = class SidebarComponent {
    mode = input(SidebarMode.FIXED);
    collapsed = model(false);
    openOverlay = model(false);
    brandTitle = input('Open ERP');
    brandSubtitle = input('Enterprise Suite');
    brandLogo = input(undefined);
    brandUrl = input('/');
    items = input([]);
    showCollapseToggle = input(true);
    width = input('16rem');
    itemClick = output();
    isOverlay = computed(() => String(this.mode()) === 'overlay');
    isMini = computed(() => this.collapsed() && !this.isOverlay());
    toggleCollapse() {
        const next = !this.collapsed();
        this.collapsed.set(next);
    }
    closeDrawer() {
        this.openOverlay.set(false);
    }
    toggleItemExpand(item, event) {
        if (this.collapsed()) {
            this.collapsed.set(false);
        }
        event.stopPropagation();
        item.expanded = !item.expanded;
    }
    onItemClick(item, event) {
        if (item.disabled)
            return;
        if ('children' in item && item.children && item.children.length > 0) {
            this.toggleItemExpand(item, event);
            return;
        }
        this.itemClick.emit(item);
        if (String(this.mode()) === 'overlay') {
            this.closeDrawer();
        }
    }
    isItemActive(item) {
        if (item.active)
            return true;
        if (item.children && item.children.some(child => child.active))
            return true;
        return false;
    }
};
SidebarComponent = __decorate([
    Component({
        selector: 'erp-sidebar, erp-nav-drawer',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './sidebar.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
    })
], SidebarComponent);
export { SidebarComponent };
//# sourceMappingURL=sidebar.component.js.map