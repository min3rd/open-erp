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
let ImageComponent = class ImageComponent {
    src = '';
    alt = 'Image';
    width;
    height;
    preview = true;
    fallbackSrc = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80';
    rounded = 'lg';
    isLoaded = false;
    hasError = false;
    isPreviewOpen = false;
    zoomScale = 1;
    rotateDeg = 0;
    onLoad() {
        this.isLoaded = true;
    }
    onError() {
        this.hasError = true;
    }
    openPreview(event) {
        if (!this.preview)
            return;
        event.stopPropagation();
        this.isPreviewOpen = true;
        this.zoomScale = 1;
        this.rotateDeg = 0;
    }
    closePreview() {
        this.isPreviewOpen = false;
    }
    zoomIn() {
        this.zoomScale = Math.min(3, this.zoomScale + 0.25);
    }
    zoomOut() {
        this.zoomScale = Math.max(0.5, this.zoomScale - 0.25);
    }
    rotate() {
        this.rotateDeg = (this.rotateDeg + 90) % 360;
    }
    getRoundedClass() {
        switch (this.rounded) {
            case 'none': return 'rounded-none';
            case 'sm': return 'rounded-md';
            case 'md': return 'rounded-xl';
            case 'xl': return 'rounded-3xl';
            case 'full': return 'rounded-full';
            case 'lg':
            default: return 'rounded-2xl';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], ImageComponent.prototype, "src", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ImageComponent.prototype, "alt", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ImageComponent.prototype, "width", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ImageComponent.prototype, "height", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], ImageComponent.prototype, "preview", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ImageComponent.prototype, "fallbackSrc", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ImageComponent.prototype, "rounded", void 0);
ImageComponent = __decorate([
    Component({
        selector: 'erp-image',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './image.component.html',
        styles: [`
    :host {
      display: inline-block;
    }
  `]
    })
], ImageComponent);
export { ImageComponent };
//# sourceMappingURL=image.component.js.map