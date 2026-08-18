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
import { NavbarPosition } from '../../../enums/component.enum';
let NavbarComponent = class NavbarComponent {
    brandTitle = '';
    brandSubtitle;
    brandLogo;
    brandUrl = '/';
    position = NavbarPosition.STICKY;
    bordered = true;
    glass = true;
    items = [];
    showMobileToggle = true;
    mobileOpen = false;
    mobileToggle = new EventEmitter();
    itemClick = new EventEmitter();
    onToggleMobile() {
        this.mobileOpen = !this.mobileOpen;
        this.mobileToggle.emit(this.mobileOpen);
    }
    onItemClick(item, event) {
        if (item.disabled)
            return;
        this.itemClick.emit(item);
        if (this.mobileOpen) {
            this.mobileOpen = false;
            this.mobileToggle.emit(false);
        }
    }
    getPositionClasses() {
        switch (this.position) {
            case NavbarPosition.FIXED:
            case 'fixed':
                return 'fixed top-0 left-0 right-0 z-40';
            case NavbarPosition.STICKY:
            case 'sticky':
                return 'sticky top-0 z-30';
            case NavbarPosition.STATIC:
            case 'static':
            default:
                return 'relative z-20';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], NavbarComponent.prototype, "brandTitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NavbarComponent.prototype, "brandSubtitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NavbarComponent.prototype, "brandLogo", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NavbarComponent.prototype, "brandUrl", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], NavbarComponent.prototype, "position", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], NavbarComponent.prototype, "bordered", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], NavbarComponent.prototype, "glass", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], NavbarComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], NavbarComponent.prototype, "showMobileToggle", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], NavbarComponent.prototype, "mobileOpen", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], NavbarComponent.prototype, "mobileToggle", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], NavbarComponent.prototype, "itemClick", void 0);
NavbarComponent = __decorate([
    Component({
        selector: 'erp-navbar, erp-header, erp-app-bar',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './navbar.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], NavbarComponent);
export { NavbarComponent };
//# sourceMappingURL=navbar.component.js.map