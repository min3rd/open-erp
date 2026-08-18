import { ElementRef } from '@angular/core';
export declare class VirtualScrollComponent<T = any> {
    items: T[];
    itemSize: number;
    height: string;
    buffer: number;
    itemTemplate?: any;
    scrollContainer: ElementRef<HTMLDivElement>;
    startIndex: number;
    endIndex: number;
    offsetY: number;
    get totalHeight(): number;
    get visibleItems(): T[];
    onScroll(): void;
}
