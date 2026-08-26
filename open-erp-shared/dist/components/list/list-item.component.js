var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
let ListItemComponent = class ListItemComponent {
    title = input(undefined);
    description = input(undefined);
    icon = input(undefined);
    clickable = input(false);
    disabled = input(false);
    active = input(false);
    itemClick = output();
    onClick(event) {
        if (!this.disabled() && this.clickable()) {
            this.itemClick.emit(event);
        }
    }
};
ListItemComponent = __decorate([
    Component({
        selector: 'erp-list-item',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './list-item.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], ListItemComponent);
export { ListItemComponent };
//# sourceMappingURL=list-item.component.js.map