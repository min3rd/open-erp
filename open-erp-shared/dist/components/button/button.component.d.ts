import { ButtonVariant, ButtonSize } from '../../enums/component.enum';
export declare class ButtonComponent {
    readonly variant: import("@angular/core").InputSignal<"primary" | "secondary" | "outline" | "danger" | "ghost" | "success" | ButtonVariant>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | ButtonSize>;
    readonly type: import("@angular/core").InputSignal<"button" | "submit" | "reset">;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly skeleton: import("@angular/core").InputSignal<boolean>;
    readonly iconLeft: import("@angular/core").InputSignal<string | undefined>;
    readonly iconRight: import("@angular/core").InputSignal<string | undefined>;
    readonly fullWidth: import("@angular/core").InputSignal<boolean>;
    readonly btnClick: import("@angular/core").OutputEmitterRef<MouseEvent>;
    readonly buttonClasses: import("@angular/core").Signal<string>;
    readonly iconSize: import("@angular/core").Signal<18 | 12 | 14>;
    readonly skeletonHeight: import("@angular/core").Signal<"2rem" | "2.75rem" | "2.375rem">;
    readonly skeletonClass: import("@angular/core").Signal<"rounded-xl" | "rounded-2xl">;
    onClick(event: MouseEvent): void;
}
