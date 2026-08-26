import { ButtonVariant, ButtonSize } from '../../enums/component.enum';
export declare class IconButtonComponent {
    readonly icon: import("@angular/core").InputSignal<string>;
    readonly variant: import("@angular/core").InputSignal<"primary" | "secondary" | "outline" | "danger" | "ghost" | "success" | ButtonVariant>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | ButtonSize>;
    readonly shape: import("@angular/core").InputSignal<"circle" | "rounded" | "square">;
    readonly tooltip: import("@angular/core").InputSignal<string | undefined>;
    readonly badge: import("@angular/core").InputSignal<string | number | undefined>;
    readonly badgeColor: import("@angular/core").InputSignal<string>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly skeleton: import("@angular/core").InputSignal<boolean>;
    readonly ariaLabel: import("@angular/core").InputSignal<string | undefined>;
    readonly btnClick: import("@angular/core").OutputEmitterRef<MouseEvent>;
    readonly variantClass: import("@angular/core").Signal<string>;
    readonly sizeClass: import("@angular/core").Signal<string>;
    readonly iconSize: import("@angular/core").Signal<number>;
    readonly shapeClass: import("@angular/core").Signal<"rounded-full" | "rounded-none" | "rounded-xl" | "rounded-2xl">;
    onClick(event: MouseEvent): void;
}
