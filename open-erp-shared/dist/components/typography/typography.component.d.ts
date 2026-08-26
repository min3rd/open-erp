import { TypographyVariant } from '../../enums/component.enum';
export declare class TypographyComponent {
    readonly variant: import("@angular/core").InputSignal<"h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "lead" | "body" | "small" | "muted" | "code" | TypographyVariant>;
    readonly weight: import("@angular/core").InputSignal<"normal" | "light" | "medium" | "semibold" | "bold" | "black" | undefined>;
    readonly align: import("@angular/core").InputSignal<"left" | "right" | "center" | "justify" | undefined>;
    readonly gradient: import("@angular/core").InputSignal<boolean>;
    readonly truncate: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly skeletonWidth: import("@angular/core").InputSignal<string>;
    readonly typographyClasses: import("@angular/core").Signal<string>;
    readonly skeletonHeight: import("@angular/core").Signal<string>;
}
