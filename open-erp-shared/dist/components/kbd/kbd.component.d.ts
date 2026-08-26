export declare class KbdComponent {
    readonly key: import("@angular/core").InputSignal<string | undefined>;
    readonly keys: import("@angular/core").InputSignal<string[] | undefined>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg">;
    readonly keyList: import("@angular/core").Signal<string[]>;
    readonly sizeClass: import("@angular/core").Signal<string>;
}
