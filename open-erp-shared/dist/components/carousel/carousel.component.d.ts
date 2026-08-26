import { OnInit, OnDestroy } from '@angular/core';
export interface CarouselSlide {
    id?: string;
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    tag?: string;
    buttonText?: string;
}
export declare class CarouselComponent implements OnInit, OnDestroy {
    readonly slides: import("@angular/core").InputSignal<(string | CarouselSlide)[]>;
    readonly currentIndex: import("@angular/core").ModelSignal<number>;
    readonly autoplay: import("@angular/core").InputSignal<boolean>;
    readonly interval: import("@angular/core").InputSignal<number>;
    readonly showArrows: import("@angular/core").InputSignal<boolean>;
    readonly showDots: import("@angular/core").InputSignal<boolean>;
    readonly height: import("@angular/core").InputSignal<string>;
    readonly indexChange: import("@angular/core").OutputEmitterRef<number>;
    readonly slideClick: import("@angular/core").OutputEmitterRef<{
        slide: CarouselSlide;
        index: number;
    }>;
    private timerRef?;
    readonly normalizedSlides: import("@angular/core").Signal<CarouselSlide[]>;
    constructor();
    ngOnInit(): void;
    ngOnDestroy(): void;
    startAutoplay(): void;
    stopAutoplay(): void;
    next(): void;
    prev(): void;
    goTo(index: number): void;
    onSlideClick(slide: CarouselSlide, index: number): void;
}
