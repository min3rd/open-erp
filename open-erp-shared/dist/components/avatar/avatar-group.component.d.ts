import { AvatarSize, AvatarShape } from '../../enums/component.enum';
export interface AvatarGroupUser {
    name: string;
    imageUrl?: string;
    online?: boolean;
}
export declare class AvatarGroupComponent {
    readonly users: import("@angular/core").InputSignal<AvatarGroupUser[]>;
    readonly max: import("@angular/core").InputSignal<number>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg" | "xs" | "xl" | AvatarSize>;
    readonly shape: import("@angular/core").InputSignal<"circle" | "rounded" | "square" | AvatarShape>;
    readonly visibleUsers: import("@angular/core").Signal<AvatarGroupUser[]>;
    readonly remainingCount: import("@angular/core").Signal<number>;
    readonly sizeClass: import("@angular/core").Signal<string>;
    readonly shapeClass: import("@angular/core").Signal<"rounded-full" | "rounded-none" | "rounded-xl">;
}
