var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
let CarouselComponent = class CarouselComponent {
    slides = [];
    currentIndex = 0;
    autoplay = true;
    interval = 4000;
    showArrows = true;
    showDots = true;
    height = '240px';
    indexChange = new EventEmitter();
    slideClick = new EventEmitter();
    timerRef;
    get normalizedSlides() {
        return this.slides.map(s => typeof s === 'string' ? { imageUrl: s } : s);
    }
    ngOnInit() {
        this.startAutoplay();
    }
    ngOnDestroy() {
        this.stopAutoplay();
    }
    startAutoplay() {
        if (this.autoplay && typeof window !== 'undefined') {
            this.stopAutoplay();
            this.timerRef = setInterval(() => {
                this.next();
            }, this.interval);
        }
    }
    stopAutoplay() {
        if (this.timerRef) {
            clearInterval(this.timerRef);
            this.timerRef = undefined;
        }
    }
    next() {
        const total = this.normalizedSlides.length;
        if (total === 0)
            return;
        this.currentIndex = (this.currentIndex + 1) % total;
        this.indexChange.emit(this.currentIndex);
    }
    prev() {
        const total = this.normalizedSlides.length;
        if (total === 0)
            return;
        this.currentIndex = (this.currentIndex - 1 + total) % total;
        this.indexChange.emit(this.currentIndex);
    }
    goTo(index) {
        this.currentIndex = index;
        this.indexChange.emit(this.currentIndex);
    }
    onSlideClick(slide, index) {
        this.slideClick.emit({ slide, index });
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], CarouselComponent.prototype, "slides", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], CarouselComponent.prototype, "currentIndex", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CarouselComponent.prototype, "autoplay", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], CarouselComponent.prototype, "interval", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CarouselComponent.prototype, "showArrows", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CarouselComponent.prototype, "showDots", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], CarouselComponent.prototype, "height", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], CarouselComponent.prototype, "indexChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], CarouselComponent.prototype, "slideClick", void 0);
CarouselComponent = __decorate([
    Component({
        selector: 'erp-carousel, erp-slider-view',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './carousel.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], CarouselComponent);
export { CarouselComponent };
//# sourceMappingURL=carousel.component.js.map