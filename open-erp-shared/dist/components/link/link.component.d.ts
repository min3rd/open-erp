export declare class LinkComponent {
    readonly href: import("@angular/core").InputSignal<string | undefined>;
    readonly routerLink: import("@angular/core").InputSignal<string | any[] | undefined>;
    readonly external: import("@angular/core").InputSignal<boolean>;
    readonly underline: import("@angular/core").InputSignal<"none" | "hover" | "always">;
    readonly color: import("@angular/core").InputSignal<"primary" | "danger" | "muted" | "slate">;
    readonly iconLeft: import("@angular/core").InputSignal<string | undefined>;
    readonly iconRight: import("@angular/core").InputSignal<string | undefined>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly colorClass: import("@angular/core").Signal<string>;
    readonly underlineClass: import("@angular/core").Signal<string>;
}
