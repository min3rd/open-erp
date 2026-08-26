var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
const ROUNDED_CLASSES = {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
    lg: 'rounded-2xl'
};
let ImageComponent = class ImageComponent {
    src = input('');
    alt = input('Image');
    width = input(undefined);
    height = input(undefined);
    preview = input(true);
    fallbackSrc = input('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80');
    rounded = input('lg');
    isLoaded = signal(false);
    hasError = signal(false);
    isPreviewOpen = signal(false);
    zoomScale = signal(1);
    rotateDeg = signal(0);
    roundedClass = computed(() => {
        return ROUNDED_CLASSES[this.rounded()] || ROUNDED_CLASSES['lg'];
    });
    onLoad() {
        this.isLoaded.set(true);
    }
    onError() {
        this.hasError.set(true);
    }
    openPreview(event) {
        if (!this.preview())
            return;
        event.stopPropagation();
        this.isPreviewOpen.set(true);
        this.zoomScale.set(1);
        this.rotateDeg.set(0);
    }
    closePreview() {
        this.isPreviewOpen.set(false);
    }
    zoomIn() {
        this.zoomScale.set(Math.min(3, this.zoomScale() + 0.25));
    }
    zoomOut() {
        this.zoomScale.set(Math.max(0.5, this.zoomScale() - 0.25));
    }
    rotate() {
        this.rotateDeg.set((this.rotateDeg() + 90) % 360);
    }
};
ImageComponent = __decorate([
    Component({
        selector: 'erp-image',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './image.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: inline-block;
    }
  `]
    })
], ImageComponent);
export { ImageComponent };
//# sourceMappingURL=image.component.js.map