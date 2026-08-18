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
let WatermarkComponent = class WatermarkComponent {
    content = 'OPEN ERP 2026';
    image;
    width = 240;
    height = 120;
    rotate = -22;
    opacity = 0.12;
    fontSize = 14;
    fontColor = 'currentColor';
    watermarkPattern = '';
    patternSize = '240px 120px';
    ngOnInit() {
        this.generateWatermark();
    }
    ngOnChanges(changes) {
        this.generateWatermark();
    }
    generateWatermark() {
        if (typeof document === 'undefined')
            return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        canvas.width = this.width;
        canvas.height = this.height;
        this.patternSize = `${this.width}px ${this.height}px`;
        ctx.translate(this.width / 2, this.height / 2);
        ctx.rotate((this.rotate * Math.PI) / 180);
        if (this.image) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = this.image;
            img.onload = () => {
                ctx.drawImage(img, -this.width / 4, -this.height / 4, this.width / 2, this.height / 2);
                this.watermarkPattern = `url(${canvas.toDataURL()})`;
            };
        }
        else {
            ctx.font = `600 ${this.fontSize}px sans-serif`;
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const lines = Array.isArray(this.content) ? this.content : [this.content];
            const lineHeight = this.fontSize * 1.4;
            const startY = -((lines.length - 1) * lineHeight) / 2;
            lines.forEach((line, index) => {
                ctx.fillText(line, 0, startY + index * lineHeight);
            });
            this.watermarkPattern = `url(${canvas.toDataURL()})`;
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Object)
], WatermarkComponent.prototype, "content", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], WatermarkComponent.prototype, "image", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], WatermarkComponent.prototype, "width", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], WatermarkComponent.prototype, "height", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], WatermarkComponent.prototype, "rotate", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], WatermarkComponent.prototype, "opacity", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], WatermarkComponent.prototype, "fontSize", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], WatermarkComponent.prototype, "fontColor", void 0);
WatermarkComponent = __decorate([
    Component({
        selector: 'erp-watermark',
        standalone: true,
        imports: [CommonModule],
        template: `
    <div class="relative w-full overflow-hidden" [style.min-height]="'100%'">
      <!-- Main Nested Content -->
      <div class="relative z-0">
        <ng-content></ng-content>
      </div>

      <!-- Watermark Canvas Overlay -->
      <div class="pointer-events-none absolute inset-0 z-10 select-none"
           [style.background-image]="watermarkPattern"
           [style.background-repeat]="'repeat'"
           [style.background-size]="patternSize"
           [style.opacity]="opacity">
      </div>
    </div>
  `,
        styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
    }
  `]
    })
], WatermarkComponent);
export { WatermarkComponent };
//# sourceMappingURL=watermark.component.js.map