import { TooltipPlacement } from '../../enums/component.enum';
export declare class TooltipContainerComponent {
    readonly content: import("@angular/core").InputSignal<string>;
    readonly placement: import("@angular/core").InputSignal<"left" | "right" | "top" | "bottom" | TooltipPlacement>;
    readonly placementClass: import("@angular/core").Signal<string>;
    readonly arrowClass: import("@angular/core").Signal<string>;
}
export declare class TooltipComponent {
    readonly content: import("@angular/core").InputSignal<string>;
    readonly placement: import("@angular/core").InputSignal<"left" | "right" | "top" | "bottom" | TooltipPlacement>;
    visible: import("@angular/core").WritableSignal<boolean>;
    show(): void;
    hide(): void;
}
