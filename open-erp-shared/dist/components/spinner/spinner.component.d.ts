import { SpinnerSize, SpinnerVariant } from '../../enums/component.enum';
export declare class SpinnerComponent {
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | "xs" | "xl" | SpinnerSize>;
    readonly variant: import("@angular/core").InputSignal<"spin" | "dots" | "pulse" | SpinnerVariant>;
    readonly color: import("@angular/core").InputSignal<string>;
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly sizeClass: import("@angular/core").Signal<string>;
    readonly dotSizeClass: import("@angular/core").Signal<string>;
}
