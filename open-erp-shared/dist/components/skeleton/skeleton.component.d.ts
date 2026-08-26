export declare class SkeletonComponent {
    readonly width: import("@angular/core").InputSignal<string>;
    readonly height: import("@angular/core").InputSignal<string>;
    readonly shape: import("@angular/core").InputSignal<"circle" | "rounded" | "pill" | "rect">;
    readonly className: import("@angular/core").InputSignal<string>;
    readonly shapeClass: import("@angular/core").Signal<string>;
}
