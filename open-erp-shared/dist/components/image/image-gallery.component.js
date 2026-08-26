var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageComponent } from './image.component';
let ImageGalleryComponent = class ImageGalleryComponent {
    images = input([]);
    columns = input(4);
    height = input('120px');
    normalizedImages = computed(() => {
        return this.images().map(img => (typeof img === 'string' ? { src: img } : img));
    });
    gridColsClass = computed(() => {
        switch (this.columns()) {
            case 2: return 'grid-cols-2';
            case 3: return 'grid-cols-2 sm:grid-cols-3';
            case 6: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6';
            case 4:
            default: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
        }
    });
};
ImageGalleryComponent = __decorate([
    Component({
        selector: 'erp-image-gallery',
        standalone: true,
        imports: [CommonModule, ImageComponent],
        templateUrl: './image-gallery.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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