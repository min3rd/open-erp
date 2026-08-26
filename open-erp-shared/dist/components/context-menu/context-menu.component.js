var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, output, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
let ContextMenuComponent = class ContextMenuComponent {
    items = input([]);
    disabled = input(false);
    itemClick = output();
    isOpen = signal(false);
    posX = signal(0);
    posY = signal(0);
    onDocumentClick() {
        this.isOpen.set(false);
    }
    onDocumentScroll() {
        this.isOpen.set(false);
    }
    onContextMenu(event) {
        if (this.disabled())
            return;
        event.preventDefault();
        event.stopPropagation();
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const menuW = 200;
        const menuH = this.items().length * 36;
        this.posX.set(event.clientX + menuW > screenW ? event.clientX - menuW : event.clientX);
        this.posY.set(event.clientY + menuH > screenH ? event.clientY - menuH : event.clientY);
        this.isOpen.set(true);
    }
    handleItemClick(item) {
        if (item.disabled)
            return;
        this.isOpen.set(false);
        if (item.action) {
            item.action();
        }
        this.itemClick.emit(item);
    }
};
__decorate([
    HostListener('document:click'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContextMenuComponent.prototype, "onDocumentClick", null);
__decorate([
    HostListener('document:scroll'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContextMenuComponent.prototype, "onDocumentScroll", null);
ContextMenuComponent = __decorate([
    Component({
        selector: 'erp-context-menu',
        standalone: true,
        imports: [CommonModule, IconComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div (contextmenu)="onContextMenu($event)" class="relative inline-block w-full">
      <!-- Target User Content Area -->
      <ng-content></ng-content>

      <!-- Context Menu Popup List -->
      @if (isOpen()) {
        <div (click)="$event.stopPropagation()"
             [style.top.px]="posY()"
             [style.left.px]="posX()"
             class="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 min-w-48 text-xs select-none transition-all animate-in fade-in zoom-in-95">
          
          @for (item of items(); track item.label) {
            @if (item.divider) {
              <div class="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
            } @else {
              <button (click)="handleItemClick(item)"
                      [disabled]="item.disabled"
                      [class.text-rose-600]="item.danger"
                      [class.dark:text-rose-400]="item.danger"
                      [class.hover:bg-rose-50]="item.danger && !item.disabled"
                      [class.dark:hover:bg-rose-950/40]="item.danger && !item.disabled"
                      [class.hover:bg-slate-100]="!item.danger && !item.disabled"
                      [class.dark:hover:bg-slate-800]="!item.danger && !item.disabled"
                      [class.opacity-40]="item.disabled"
                      [class.cursor-not-allowed]="item.disabled"
                      [class.cursor-pointer]="!item.disabled"
                      type="button"
                      class="w-full flex items-center justify-between px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 transition-colors">
                
                <div class="flex items-center gap-2.5">
                  @if (item.icon) {
                    <erp-icon [name]="item.icon" [size]="14"></erp-icon>
                  }
                  <span class="font-medium">{{ item.label }}</span>
                </div>

                @if (item.shortcut) {
                  <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-3">{{ item.shortcut }}</span>
                }
              </button>
            }
          }

        </div>
      }
    </div>
  `,
        styles: [`
    :host {
      display: block;
    }
  `]
    })
], ContextMenuComponent);
export { ContextMenuComponent };
//# sourceMappingURL=context-menu.component.js.map