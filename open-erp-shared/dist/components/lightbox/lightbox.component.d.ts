import { EventEmitter } from '@angular/core';
export declare class LightboxComponent {
    images: string[];
    currentIndex: number;
    visible: boolean;
    title?: string;
    visibleChange: EventEmitter<boolean>;
    currentIndexChange: EventEmitter<number>;
    indexChange: EventEmitter<number>;
    zoomLevel: number;
    rotation: number;
    onKeyDown(event: KeyboardEvent): void;
    handleClose(): void;
    prevImage(): void;
    nextImage(): void;
    zoomIn(): void;
    zoomOut(): void;
    rotateClockwise(): void;
    resetTransform(): void;
}
