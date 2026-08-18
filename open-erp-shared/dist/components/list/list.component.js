var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
let ListComponent = class ListComponent {
    header;
    footer;
    bordered = true;
    striped = false;
    hoverable = true;
    compact = false;
};
__decorate([
    Input(),
    __metadata("design:type", String)
], ListComponent.prototype, "header", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ListComponent.prototype, "footer", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ListComponent.prototype, "bordered", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ListComponent.prototype, "striped", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ListComponent.prototype, "hoverable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ListComponent.prototype, "compact", void 0);
ListComponent = __decorate([
    Component({
        selector: 'erp-list',
        standalone: true,
        imports: [CommonModule],
        templateUrl: './list.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], ListComponent);
export { ListComponent };
//# sourceMappingURL=list.component.js.map