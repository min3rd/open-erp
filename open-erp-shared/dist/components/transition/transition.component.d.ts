import { TransitionType } from '../../enums/component.enum';
export declare class TransitionComponent {
    readonly show: import("@angular/core").InputSignal<boolean>;
    readonly type: import("@angular/core").InputSignal<"fade" | "scale" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "collapse" | TransitionType>;
    readonly duration: import("@angular/core").InputSignal<number>;
    readonly transitionClasses: import("@angular/core").Signal<string>;
}
