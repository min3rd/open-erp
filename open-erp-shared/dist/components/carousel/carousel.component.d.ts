import { EventEmitter, OnInit, OnDestroy } from '@angular/core';
export interface CarouselSlide {
    id?: string;
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    tag?: string;
    buttonText?: string;
}
export declare class CarouselComponent implements OnInit, OnDestroy {
    slides: (string | CarouselSlide)[];
    currentIndex: number;
    autoplay: boolean;
    interval: number;
    showArrows: boolean;
    showDots: boolean;
    height: string;
    indexChange: EventEmitter<number>;
    slideClick: EventEmitter<{
        slide: CarouselSlide;
        index: number;
    }>;
    private timerRef?;
    get normalizedSlides(): CarouselSlide[];
    ngOnInit(): void;
    ngOnDestroy(): void;
    startAutoplay(): void;
    stopAutoplay(): void;
    next(): void;
    prev(): void;
    goTo(index: number): void;
    onSlideClick(slide: CarouselSlide, index: number): void;
}
