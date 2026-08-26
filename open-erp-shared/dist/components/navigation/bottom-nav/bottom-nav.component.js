var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
let BottomNavComponent = class BottomNavComponent {
    items = input([]);
    activeId = model(undefined);
    fixed = input(true);
    safeArea = input(true);
    floating = input(false);
    showLabels = input(true);
    itemClick = output();
    currentActiveId = computed(() => {
        const act = this.activeId();
        if (act)
            return act;
        const its = this.items();
        return its.length > 0 ? its[0].id : '';
    });
    onItemSelect(item) {
        if (item.disabled)
            return;
        this.activeId.set(item.id);
        this.itemClick.emit(item);
    }
};
BottomNavComponent = __decorate([
    Component({
        selector: 'erp-bottom-nav, erp-bottom-navigation',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './bottom-nav.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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