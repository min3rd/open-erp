var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipPlacement } from '../../enums/component.enum';
const PLACEMENT_CLASSES = {
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2'
};
const ARROW_CLASSES = {
    bottom: '-top-1 left-1/2 -translate-x-1/2',
    left: '-right-1 top-1/2 -translate-y-1/2',
    right: '-left-1 top-1/2 -translate-y-1/2',
    top: '-bottom-1 left-1/2 -translate-x-1/2'
};
let TooltipContainerComponent = class TooltipContainerComponent {
    content = input('');
    placement = input(TooltipPlacement.TOP);
    placementClass = computed(() => {
        const p = String(this.placement());
        return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES['top'];
    });
    arrowClass = computed(() => {
        const p = String(this.placement());
        return ARROW_CLASSES[p] || ARROW_CLASSES['top'];
    });
};
TooltipContainerComponent = __decorate([
    Component({
        selector: 'erp-tooltip-container',
        standalone: true,
        imports: [CommonModule],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div [class]="placementClass()"
         class="absolute z-50 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/95 dark:bg-slate-800 rounded-xl shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in duration-150 backdrop-blur-xs">
      {{ content() }}
      <!-- Triangle Arrow -->
      <span [class]="arrowClass()" class="absolute w-2 h-2 bg-slate-900/95 dark:bg-slate-800 rotate-45"></span>
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
    content = input('');
    placement = input(TooltipPlacement.TOP);
    visible = signal(false);
    show() {
        this.visible.set(true);
    }
    hide() {
        this.visible.set(false);
    }
};
TooltipComponent = __decorate([
    Component({
        selector: 'erp-tooltip',
        standalone: true,
        imports: [CommonModule, TooltipContainerComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div (mouseenter)="show()" (mouseleave)="hide()" class="relative inline-block">
      <ng-content></ng-content>
      @if (visible() && content()) {
        <erp-tooltip-container [content]="content()" [placement]="placement()"></erp-tooltip-container>
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