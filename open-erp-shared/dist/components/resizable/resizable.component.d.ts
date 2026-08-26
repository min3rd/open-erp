import { OnInit } from '@angular/core';
export declare class ResizableComponent implements OnInit {
    readonly initialWidth: import("@angular/core").InputSignal<number>;
    readonly initialHeight: import("@angular/core").InputSignal<number>;
    readonly minWidth: import("@angular/core").InputSignal<number>;
    readonly minHeight: import("@angular/core").InputSignal<number>;
    readonly maxWidth: import("@angular/core").InputSignal<number>;
    readonly maxHeight: import("@angular/core").InputSignal<number>;
    readonly enableRight: import("@angular/core").InputSignal<boolean>;
    readonly enableBottom: import("@angular/core").InputSignal<boolean>;
    readonly enableCorner: import("@angular/core").InputSignal<boolean>;
    readonly resizeEnd: import("@angular/core").OutputEmitterRef<{
        width: number;
        height: number;
    }>;
    currentWidth: import("@angular/core").WritableSignal<number>;
    currentHeight: import("@angular/core").WritableSignal<number>;
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
