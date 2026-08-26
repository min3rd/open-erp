var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
let AccordionComponent = class AccordionComponent {
    items = input([]);
    expandMultiple = input(false);
    bordered = input(true);
    ghost = input(false);
    itemToggle = output();
    toggleItem(item, index) {
        if (item.disabled)
            return;
        const nextState = !item.expanded;
        if (!this.expandMultiple() && nextState) {
            this.items().forEach((it, i) => {
                if (i !== index)
                    it.expanded = false;
            });
        }
        item.expanded = nextState;
        this.itemToggle.emit({ item, index, expanded: nextState });
    }
    onKeyDown(event, item, index) {
        if (item.disabled)
            return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggleItem(item, index);
        }
    }
};
AccordionComponent = __decorate([
    Component({
        selector: 'erp-accordion, erp-collapse',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './accordion.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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