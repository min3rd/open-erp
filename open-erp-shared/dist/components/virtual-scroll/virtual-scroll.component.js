var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, ContentChild, TemplateRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
let VirtualScrollComponent = class VirtualScrollComponent {
    items = [];
    itemSize = 48; // px height per row
    height = '360px'; // container height
    buffer = 5; // buffer items above and below
    itemTemplate;
    scrollContainer;
    startIndex = 0;
    endIndex = 20;
    offsetY = 0;
    get totalHeight() {
        return this.items.length * this.itemSize;
    }
    get visibleItems() {
        return this.items.slice(this.startIndex, this.endIndex);
    }
    onScroll() {
        if (!this.scrollContainer)
            return;
        const scrollTop = this.scrollContainer.nativeElement.scrollTop;
        const viewportHeight = this.scrollContainer.nativeElement.clientHeight;
        const start = Math.floor(scrollTop / this.itemSize);
        const visibleCount = Math.ceil(viewportHeight / this.itemSize);
        this.startIndex = Math.max(0, start - this.buffer);
        this.endIndex = Math.min(this.items.length, start + visibleCount + this.buffer);
        this.offsetY = this.startIndex * this.itemSize;
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], VirtualScrollComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], VirtualScrollComponent.prototype, "itemSize", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], VirtualScrollComponent.prototype, "height", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], VirtualScrollComponent.prototype, "buffer", void 0);
__decorate([
    ContentChild(TemplateRef),
    __metadata("design:type", Object)
], VirtualScrollComponent.prototype, "itemTemplate", void 0);
__decorate([
    ViewChild('scrollContainer'),
    __metadata("design:type", ElementRef)
], VirtualScrollComponent.prototype, "scrollContainer", void 0);
VirtualScrollComponent = __decorate([
    Component({
        selector: 'erp-virtual-scroll, erp-virtual-list',
        standalone: true,
        imports: [CommonModule],
        template: `
    <div #scrollContainer
         (scroll)="onScroll()"
         [style.height]="height"
         class="overflow-y-auto relative custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
      
      <!-- Total Virtual Canvas Height -->
      <div [style.height.px]="totalHeight" class="relative w-full">
        
        <!-- Rendered Sliced Items Viewport -->
        <div [style.transform]="'translateY(' + offsetY + 'px)'" class="absolute top-0 left-0 right-0">
          @for (item of visibleItems; track $index) {
            <div [style.height.px]="itemSize" class="box-border">
              <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item, index: startIndex + $index }"></ng-container>
            </div>
          }
        </div>

      </div>
    </div>
  `,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], VirtualScrollComponent);
export { VirtualScrollComponent };
//# sourceMappingURL=virtual-scroll.component.js.map