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
let AccordionComponent = class AccordionComponent {
    items = [];
    expandMultiple = false;
    bordered = true;
    ghost = false;
    itemToggle = new EventEmitter();
    toggleItem(item, index) {
        if (item.disabled)
            return;
        const nextState = !item.expanded;
        if (!this.expandMultiple && nextState) {
            this.items.forEach((it, i) => {
                if (i !== index)
                    it.expanded = false;
            });
        }
        item.expanded = nextState;
        this.itemToggle.emit({ item, index, expanded: nextState });
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], AccordionComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AccordionComponent.prototype, "expandMultiple", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AccordionComponent.prototype, "bordered", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AccordionComponent.prototype, "ghost", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], AccordionComponent.prototype, "itemToggle", void 0);
AccordionComponent = __decorate([
    Component({
        selector: 'erp-accordion, erp-collapse',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './accordion.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], AccordionComponent);
export { AccordionComponent };
//# sourceMappingURL=accordion.component.js.map