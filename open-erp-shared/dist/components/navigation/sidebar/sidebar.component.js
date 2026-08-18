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
import { SidebarMode } from '../../../enums/component.enum';
let SidebarComponent = class SidebarComponent {
    mode = SidebarMode.FIXED;
    collapsed = false;
    openOverlay = false;
    brandTitle = 'Open ERP';
    brandSubtitle = 'Enterprise Suite';
    brandLogo;
    brandUrl = '/';
    items = [];
    showCollapseToggle = true;
    width = '16rem'; // w-64
    collapsedChange = new EventEmitter();
    openOverlayChange = new EventEmitter();
    itemClick = new EventEmitter();
    toggleCollapse() {
        this.collapsed = !this.collapsed;
        this.collapsedChange.emit(this.collapsed);
    }
    closeDrawer() {
        this.openOverlay = false;
        this.openOverlayChange.emit(false);
    }
    toggleItemExpand(item, event) {
        if (this.collapsed) {
            this.collapsed = false;
            this.collapsedChange.emit(false);
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
        if (String(this.mode) === 'overlay') {
            this.closeDrawer();
        }
    }
    get isOverlay() {
        return String(this.mode) === 'overlay';
    }
    get isMini() {
        return this.collapsed && !this.isOverlay;
    }
    isItemActive(item) {
        if (item.active)
            return true;
        if (item.children && item.children.some(child => child.active))
            return true;
        return false;
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], SidebarComponent.prototype, "mode", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SidebarComponent.prototype, "collapsed", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SidebarComponent.prototype, "openOverlay", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SidebarComponent.prototype, "brandTitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SidebarComponent.prototype, "brandSubtitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SidebarComponent.prototype, "brandLogo", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SidebarComponent.prototype, "brandUrl", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], SidebarComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SidebarComponent.prototype, "showCollapseToggle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SidebarComponent.prototype, "width", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SidebarComponent.prototype, "collapsedChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SidebarComponent.prototype, "openOverlayChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SidebarComponent.prototype, "itemClick", void 0);
SidebarComponent = __decorate([
    Component({
        selector: 'erp-sidebar, erp-nav-drawer',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './sidebar.component.html',
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