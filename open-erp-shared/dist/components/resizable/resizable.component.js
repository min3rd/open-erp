var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
let ResizableComponent = class ResizableComponent {
    initialWidth = 320;
    initialHeight = 200;
    minWidth = 160;
    minHeight = 100;
    maxWidth = 800;
    maxHeight = 600;
    enableRight = true;
    enableBottom = true;
    enableCorner = true;
    resizeEnd = new EventEmitter();
    currentWidth = 320;
    currentHeight = 200;
    resizingDirection = null;
    startX = 0;
    startY = 0;
    startW = 0;
    startH = 0;
    ngOnInit() {
        this.currentWidth = this.initialWidth;
        this.currentHeight = this.initialHeight;
    }
    startResize(event, dir) {
        event.preventDefault();
        event.stopPropagation();
        this.resizingDirection = dir;
        this.startX = event.clientX;
        this.startY = event.clientY;
        this.startW = this.currentWidth;
        this.startH = this.currentHeight;
    }
    onMouseMove(event) {
        if (!this.resizingDirection)
            return;
        const deltaX = event.clientX - this.startX;
        const deltaY = event.clientY - this.startY;
        if (this.resizingDirection === 'right' || this.resizingDirection === 'corner') {
            const nextW = this.startW + deltaX;
            this.currentWidth = Math.max(this.minWidth, Math.min(this.maxWidth, nextW));
        }
        if (this.resizingDirection === 'bottom' || this.resizingDirection === 'corner') {
            const nextH = this.startH + deltaY;
            this.currentHeight = Math.max(this.minHeight, Math.min(this.maxHeight, nextH));
        }
    }
    onMouseUp() {
        if (this.resizingDirection) {
            this.resizingDirection = null;
            this.resizeEnd.emit({ width: this.currentWidth, height: this.currentHeight });
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Number)
], ResizableComponent.prototype, "initialWidth", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], ResizableComponent.prototype, "initialHeight", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], ResizableComponent.prototype, "minWidth", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], ResizableComponent.prototype, "minHeight", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], ResizableComponent.prototype, "maxWidth", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], ResizableComponent.prototype, "maxHeight", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ResizableComponent.prototype, "enableRight", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ResizableComponent.prototype, "enableBottom", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ResizableComponent.prototype, "enableCorner", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], ResizableComponent.prototype, "resizeEnd", void 0);
__decorate([
    HostListener('document:mousemove', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], ResizableComponent.prototype, "onMouseMove", null);
__decorate([
    HostListener('document:mouseup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ResizableComponent.prototype, "onMouseUp", null);
ResizableComponent = __decorate([
    Component({
        selector: 'erp-resizable',
        standalone: true,
        imports: [CommonModule],
        template: `
    <div class="relative overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm"
         [style.width.px]="currentWidth"
         [style.height.px]="currentHeight">
      
      <!-- User Inner Content -->
      <div class="w-full h-full p-4 overflow-auto custom-scrollbar">
        <ng-content></ng-content>
      </div>

      <!-- Right Resize Handle -->
      @if (enableRight) {
        <div (mousedown)="startResize($event, 'right')"
             class="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-indigo-500/30 transition-colors"></div>
      }

      <!-- Bottom Resize Handle -->
      @if (enableBottom) {
        <div (mousedown)="startResize($event, 'bottom')"
             class="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-indigo-500/30 transition-colors"></div>
      }

      <!-- Bottom-Right Corner Handle -->
      @if (enableCorner) {
        <div (mousedown)="startResize($event, 'corner')"
             class="absolute bottom-1 right-1 w-3.5 h-3.5 cursor-nwse-resize flex items-end justify-end p-0.5 opacity-40 hover:opacity-100 transition-opacity">
          <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor" class="text-slate-500 dark:text-slate-400">
            <path d="M6 6H0L6 0V6Z" />
          </svg>
        </div>
      }

    </div>
  `,
        styles: [`
    :host {
      display: inline-block;
    }
  `]
    })
], ResizableComponent);
export { ResizableComponent };
//# sourceMappingURL=resizable.component.js.map