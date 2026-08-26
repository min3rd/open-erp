export declare class LightboxComponent {
    readonly images: import("@angular/core").InputSignal<string[]>;
    readonly currentIndex: import("@angular/core").ModelSignal<number>;
    readonly visible: import("@angular/core").ModelSignal<boolean>;
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly indexChange: import("@angular/core").OutputEmitterRef<number>;
    zoomLevel: import("@angular/core").WritableSignal<number>;
    rotation: import("@angular/core").WritableSignal<number>;
    onKeyDown(event: KeyboardEvent): void;
    handleClose(): void;
    selectIndex(idx: number): void;
    prevImage(): void;
    nextImage(): void;
    zoomIn(): void;
    zoomOut(): void;
    rotateClockwise(): void;
    resetTransform(): void;
}
