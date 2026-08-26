import { AvatarSize, AvatarShape } from '../../enums/component.enum';
export declare class AvatarComponent {
    readonly name: import("@angular/core").InputSignal<string>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | "xs" | "xl" | AvatarSize>;
    readonly shape: import("@angular/core").InputSignal<"circle" | "rounded" | "square" | AvatarShape>;
    readonly online: import("@angular/core").InputSignal<boolean>;
    readonly imageUrl: import("@angular/core").InputSignal<string | undefined>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly initial: import("@angular/core").Signal<string>;
    readonly sizeClass: import("@angular/core").Signal<string>;
    readonly shapeClass: import("@angular/core").Signal<"rounded-full" | "rounded-none" | "rounded-xl" | "rounded-2xl">;
}
