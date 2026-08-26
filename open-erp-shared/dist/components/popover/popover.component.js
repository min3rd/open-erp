var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverPlacement, PopoverTrigger } from '../../enums/component.enum';
const PLACEMENT_CLASSES = {
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2'
};
let PopoverComponent = class PopoverComponent {
    elementRef;
    title = input(undefined);
    content = input(undefined);
    placement = input(PopoverPlacement.TOP);
    trigger = input(PopoverTrigger.CLICK);
    width = input(undefined);
    isOpen = signal(false);
    hoverTimeout;
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    placementClasses = computed(() => {
        const p = String(this.placement());
        return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES['top'];
    });
    onDocumentClick(event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
        }
    }
    onTriggerClick() {
        if (this.trigger() === 'click' || String(this.trigger()) === PopoverTrigger.CLICK) {
            this.isOpen.update(v => !v);
        }
    }
    onMouseEnter() {
        if (this.trigger() === 'hover' || String(this.trigger()) === PopoverTrigger.HOVER) {
            clearTimeout(this.hoverTimeout);
            this.isOpen.set(true);
        }
    }
    onMouseLeave() {
        if (this.trigger() === 'hover' || String(this.trigger()) === PopoverTrigger.HOVER) {
            this.hoverTimeout = setTimeout(() => {
                this.isOpen.set(false);
            }, 150);
        }
    }
};
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], PopoverComponent.prototype, "onDocumentClick", null);
PopoverComponent = __decorate([
    Component({
        selector: 'erp-popover',
        standalone: true,
        imports: [CommonModule],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div class="relative inline-block">
      <!-- Trigger Content -->
      <div
        (click)="onTriggerClick()"
        (mouseenter)="onMouseEnter()"
        (mouseleave)="onMouseLeave()"
        class="inline-block cursor-pointer"
      >
        <ng-content select="[popover-trigger]"></ng-content>
      </div>

      <!-- Popover Floating Box -->
      @if (isOpen()) {
        <div
          [class]="placementClasses()"
          [style.width]="width()"
          (mouseenter)="onMouseEnter()"
          (mouseleave)="onMouseLeave()"
          class="absolute z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-xs text-slate-700 dark:text-slate-200 transition-all duration-200 animate-in fade-in zoom-in-95 min-w-56"
        >
          <!-- Popover Title -->
          @if (title()) {
            <div
              class="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2"
            >
              {{ title() }}
            </div>
          }

          <!-- Popover Body -->
          <div class="leading-relaxed">
            @if (content()) {
              <p>{{ content() }}</p>
            }
            <ng-content></ng-content>
          </div>
        </div>
      }
    </div>
  `,
        styles: [`
    :host {
      display: inline-block;
      position: relative;
    }
  `]
    }),
    __metadata("design:paramtypes", [ElementRef])
], PopoverComponent);
export { PopoverComponent };
//# sourceMappingURL=popover.component.js.map