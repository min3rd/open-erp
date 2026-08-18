import { EventEmitter } from '@angular/core';
export declare class ResizableComponent {
    initialWidth: number;
    initialHeight: number;
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
    enableRight: boolean;
    enableBottom: boolean;
    enableCorner: boolean;
    resizeEnd: EventEmitter<{
        width: number;
        height: number;
    }>;
    currentWidth: number;
    currentHeight: number;
    private resizingDirection;
    private startX;
    private startY;
    private startW;
    private startH;
    ngOnInit(): void;
    startResize(event: MouseEvent, dir: 'right' | 'bottom' | 'corner'): void;
    onMouseMove(event: MouseEvent): void;
    onMouseUp(): void;
}
