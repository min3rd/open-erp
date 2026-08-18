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
import { ImageComponent } from './image.component';
let ImageGalleryComponent = class ImageGalleryComponent {
    images = [];
    columns = 4;
    height = '120px';
    get normalizedImages() {
        return this.images.map(img => typeof img === 'string' ? { src: img } : img);
    }
    getGridColsClasses() {
        switch (this.columns) {
            case 2: return 'grid-cols-2';
            case 3: return 'grid-cols-2 sm:grid-cols-3';
            case 6: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6';
            case 4:
            default: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], ImageGalleryComponent.prototype, "images", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], ImageGalleryComponent.prototype, "columns", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ImageGalleryComponent.prototype, "height", void 0);
ImageGalleryComponent = __decorate([
    Component({
        selector: 'erp-image-gallery',
        standalone: true,
        imports: [CommonModule, ImageComponent],
        templateUrl: './image-gallery.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], ImageGalleryComponent);
export { ImageGalleryComponent };
//# sourceMappingURL=image-gallery.component.js.map