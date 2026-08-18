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
import { IconComponent } from '../icon/icon.component';
let ListItemComponent = class ListItemComponent {
    title;
    description;
    icon;
    clickable = false;
    disabled = false;
    active = false;
    itemClick = new EventEmitter();
    onClick(event) {
        if (!this.disabled && this.clickable) {
            this.itemClick.emit(event);
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], ListItemComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ListItemComponent.prototype, "description", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ListItemComponent.prototype, "icon", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ListItemComponent.prototype, "clickable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ListItemComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ListItemComponent.prototype, "active", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ListItemComponent.prototype, "itemClick", void 0);
ListItemComponent = __decorate([
    Component({
        selector: 'erp-list-item',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './list-item.component.html',
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