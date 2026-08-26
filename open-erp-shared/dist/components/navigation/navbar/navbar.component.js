var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { NavbarPosition } from '../../../enums/component.enum';
const POSITION_CLASSES = {
    [NavbarPosition.FIXED]: 'fixed top-0 left-0 right-0 z-40',
    [NavbarPosition.STICKY]: 'sticky top-0 z-30',
    [NavbarPosition.STATIC]: 'relative z-20'
};
let NavbarComponent = class NavbarComponent {
    brandTitle = input('');
    brandSubtitle = input(undefined);
    brandLogo = input(undefined);
    brandUrl = input('/');
    position = input(NavbarPosition.STICKY);
    bordered = input(true);
    glass = input(true);
    items = input([]);
    showMobileToggle = input(true);
    mobileOpen = model(false);
    mobileToggle = output();
    itemClick = output();
    positionClass = computed(() => {
        const p = String(this.position());
        return POSITION_CLASSES[p] || POSITION_CLASSES[NavbarPosition.STICKY];
    });
    onToggleMobile() {
        const next = !this.mobileOpen();
        this.mobileOpen.set(next);
        this.mobileToggle.emit(next);
    }
    onItemClick(item, event) {
        if (item.disabled)
            return;
        this.itemClick.emit(item);
        if (this.mobileOpen()) {
            this.mobileOpen.set(false);
            this.mobileToggle.emit(false);
        }
    }
};
NavbarComponent = __decorate([
    Component({
        selector: 'erp-navbar, erp-header, erp-app-bar',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './navbar.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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