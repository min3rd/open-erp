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
import { IconComponent } from '../icon/icon.component';
let DescriptionItemComponent = class DescriptionItemComponent {
    label = '';
    value;
    icon;
};
__decorate([
    Input(),
    __metadata("design:type", String)
], DescriptionItemComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], DescriptionItemComponent.prototype, "value", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], DescriptionItemComponent.prototype, "icon", void 0);
DescriptionItemComponent = __decorate([
    Component({
        selector: 'erp-description-item, erp-key-value-item',
        standalone: true,
        imports: [CommonModule, IconComponent],
        template: `
    <div class="p-3.5 flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800/60">
      <span class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        @if (icon) {
          <erp-icon [name]="icon" [size]="12"></erp-icon>
        }
        {{ label }}
      </span>
      <div class="font-bold text-xs text-slate-800 dark:text-slate-200">
        <ng-content>{{ value }}</ng-content>
      </div>
    </div>
  `,
        styles: [`
    :host {
      display: block;
    }
  `]
    })
], DescriptionItemComponent);
export { DescriptionItemComponent };
//# sourceMappingURL=description-item.component.js.map