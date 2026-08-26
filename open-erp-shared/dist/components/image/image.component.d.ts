export declare class ImageComponent {
    readonly src: import("@angular/core").InputSignal<string>;
    readonly alt: import("@angular/core").InputSignal<string>;
    readonly width: import("@angular/core").InputSignal<string | undefined>;
    readonly height: import("@angular/core").InputSignal<string | undefined>;
    readonly preview: import("@angular/core").InputSignal<boolean>;
    readonly fallbackSrc: import("@angular/core").InputSignal<string>;
    readonly rounded: import("@angular/core").InputSignal<"sm" | "md" | "lg" | "xl" | "none" | "full">;
    isLoaded: import("@angular/core").WritableSignal<boolean>;
    hasError: import("@angular/core").WritableSignal<boolean>;
    isPreviewOpen: import("@angular/core").WritableSignal<boolean>;
    zoomScale: import("@angular/core").WritableSignal<number>;
    rotateDeg: import("@angular/core").WritableSignal<number>;
    readonly roundedClass: import("@angular/core").Signal<string>;
    onLoad(): void;
    onError(): void;
    openPreview(event: MouseEvent): void;
    closePreview(): void;
    zoomIn(): void;
    zoomOut(): void;
    rotate(): void;
}
