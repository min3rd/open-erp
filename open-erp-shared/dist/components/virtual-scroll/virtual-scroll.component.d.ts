import { ElementRef } from '@angular/core';
export declare class VirtualScrollComponent<T = any> {
    readonly items: import("@angular/core").InputSignal<T[]>;
    readonly itemSize: import("@angular/core").InputSignal<number>;
    readonly height: import("@angular/core").InputSignal<string>;
    readonly buffer: import("@angular/core").InputSignal<number>;
    itemTemplate?: any;
    scrollContainer: ElementRef<HTMLDivElement>;
    startIndex: import("@angular/core").WritableSignal<number>;
    endIndex: import("@angular/core").WritableSignal<number>;
    offsetY: import("@angular/core").WritableSignal<number>;
    readonly totalHeight: import("@angular/core").Signal<number>;
    readonly visibleItems: import("@angular/core").Signal<T[]>;
    onScroll(): void;
}
