var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, model, output, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
let CarouselComponent = class CarouselComponent {
    slides = input([]);
    currentIndex = model(0);
    autoplay = input(true);
    interval = input(4000);
    showArrows = input(true);
    showDots = input(true);
    height = input('240px');
    indexChange = output();
    slideClick = output();
    timerRef;
    normalizedSlides = computed(() => {
        return this.slides().map(s => (typeof s === 'string' ? { imageUrl: s } : s));
    });
    constructor() {
        effect(() => {
            const isAuto = this.autoplay();
            if (isAuto) {
                this.startAutoplay();
            }
            else {
                this.stopAutoplay();
            }
        });
    }
    ngOnInit() {
        if (this.autoplay()) {
            this.startAutoplay();
        }
    }
    ngOnDestroy() {
        this.stopAutoplay();
    }
    startAutoplay() {
        if (this.autoplay() && typeof window !== 'undefined') {
            this.stopAutoplay();
            this.timerRef = setInterval(() => {
                this.next();
            }, this.interval());
        }
    }
    stopAutoplay() {
        if (this.timerRef) {
            clearInterval(this.timerRef);
            this.timerRef = undefined;
        }
    }
    next() {
        const total = this.normalizedSlides().length;
        if (total === 0)
            return;
        const nextIdx = (this.currentIndex() + 1) % total;
        this.currentIndex.set(nextIdx);
        this.indexChange.emit(nextIdx);
    }
    prev() {
        const total = this.normalizedSlides().length;
        if (total === 0)
            return;
        const prevIdx = (this.currentIndex() - 1 + total) % total;
        this.currentIndex.set(prevIdx);
        this.indexChange.emit(prevIdx);
    }
    goTo(index) {
        this.currentIndex.set(index);
        this.indexChange.emit(index);
    }
    onSlideClick(slide, index) {
        this.slideClick.emit({ slide, index });
    }
};
CarouselComponent = __decorate([
    Component({
        selector: 'erp-carousel, erp-slider-view',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './carousel.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    }),
    __metadata("design:paramtypes", [])
], CarouselComponent);
export { CarouselComponent };
//# sourceMappingURL=carousel.component.js.map