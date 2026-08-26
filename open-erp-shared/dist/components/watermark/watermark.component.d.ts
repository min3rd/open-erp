export declare class WatermarkComponent {
    readonly content: import("@angular/core").InputSignal<string | string[]>;
    readonly image: import("@angular/core").InputSignal<string | undefined>;
    readonly width: import("@angular/core").InputSignal<number>;
    readonly height: import("@angular/core").InputSignal<number>;
    readonly rotate: import("@angular/core").InputSignal<number>;
    readonly opacity: import("@angular/core").InputSignal<number>;
    readonly fontSize: import("@angular/core").InputSignal<number>;
    readonly fontColor: import("@angular/core").InputSignal<string>;
    watermarkPattern: import("@angular/core").WritableSignal<string>;
    patternSize: import("@angular/core").WritableSignal<string>;
    constructor();
    private generateWatermark;
}
