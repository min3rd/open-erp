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
import { TooltipPlacement } from '../../enums/component.enum';
let TooltipContainerComponent = class TooltipContainerComponent {
    content = '';
    placement = TooltipPlacement.TOP;
    getPlacementClasses() {
        const p = String(this.placement);
        switch (p) {
            case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2';
            case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2';
            case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2';
            case 'top':
            default: return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
        }
    }
    getArrowClasses() {
        const p = String(this.placement);
        switch (p) {
            case 'bottom': return '-top-1 left-1/2 -translate-x-1/2';
            case 'left': return '-right-1 top-1/2 -translate-y-1/2';
            case 'right': return '-left-1 top-1/2 -translate-y-1/2';
            case 'top':
            default: return '-bottom-1 left-1/2 -translate-x-1/2';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], TooltipContainerComponent.prototype, "content", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TooltipContainerComponent.prototype, "placement", void 0);
TooltipContainerComponent = __decorate([
    Component({
        selector: 'erp-tooltip-container',
        standalone: true,
        imports: [CommonModule],
        template: `
    <div [ngClass]="getPlacementClasses()"
         class="absolute z-50 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/95 dark:bg-slate-800 rounded-xl shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in duration-150 backdrop-blur-xs">
      {{ content }}
      <!-- Triangle Arrow -->
      <span [ngClass]="getArrowClasses()" class="absolute w-2 h-2 bg-slate-900/95 dark:bg-slate-800 rotate-45"></span>
    </div>
  `,
        styles: [`
    :host {
      display: inline-block;
      position: absolute;
      pointer-events: none;
      z-index: 50;
    }
  `]
    })
], TooltipContainerComponent);
export { TooltipContainerComponent };
let TooltipComponent = class TooltipComponent {
    content = '';
    placement = TooltipPlacement.TOP;
    visible = false;
    show() {
        this.visible = true;
    }
    hide() {
        this.visible = false;
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], TooltipComponent.prototype, "content", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TooltipComponent.prototype, "placement", void 0);
TooltipComponent = __decorate([
    Component({
        selector: 'erp-tooltip',
        standalone: true,
        imports: [CommonModule, TooltipContainerComponent],
        template: `
    <div (mouseenter)="show()" (mouseleave)="hide()" class="relative inline-block">
      <ng-content></ng-content>
      @if (visible && content) {
        <erp-tooltip-container [content]="content" [placement]="placement"></erp-tooltip-container>
      }
    </div>
  `,
        styles: [`
    :host {
      display: inline-block;
    }
  `]
    })
], TooltipComponent);
export { TooltipComponent };
//# sourceMappingURL=tooltip.component.js.map