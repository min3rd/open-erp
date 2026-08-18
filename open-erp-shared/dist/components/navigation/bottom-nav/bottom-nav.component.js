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
let BottomNavComponent = class BottomNavComponent {
    items = [];
    activeId;
    fixed = true;
    safeArea = true;
    floating = false;
    showLabels = true;
    itemClick = new EventEmitter();
    activeIdChange = new EventEmitter();
    get currentActiveId() {
        if (this.activeId)
            return this.activeId;
        return this.items.length > 0 ? this.items[0].id : '';
    }
    onItemSelect(item) {
        if (item.disabled)
            return;
        this.activeId = item.id;
        this.activeIdChange.emit(item.id);
        this.itemClick.emit(item);
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], BottomNavComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], BottomNavComponent.prototype, "activeId", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BottomNavComponent.prototype, "fixed", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BottomNavComponent.prototype, "safeArea", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BottomNavComponent.prototype, "floating", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], BottomNavComponent.prototype, "showLabels", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BottomNavComponent.prototype, "itemClick", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], BottomNavComponent.prototype, "activeIdChange", void 0);
BottomNavComponent = __decorate([
    Component({
        selector: 'erp-bottom-nav, erp-bottom-navigation',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './bottom-nav.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], BottomNavComponent);
export { BottomNavComponent };
//# sourceMappingURL=bottom-nav.component.js.map