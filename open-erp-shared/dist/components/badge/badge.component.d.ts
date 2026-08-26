import { BadgeVariant, BadgeColor, BadgeCorner } from '../../enums/component.enum';
export declare class BadgeComponent {
    readonly value: import("@angular/core").InputSignal<string | number | undefined>;
    readonly count: import("@angular/core").InputSignal<number | undefined>;
    readonly maxCount: import("@angular/core").InputSignal<number>;
    readonly showZero: import("@angular/core").InputSignal<boolean>;
    readonly corner: import("@angular/core").InputSignal<"bottom-right" | "bottom-left" | "top-right" | "top-left" | BadgeCorner | undefined>;
    readonly variant: import("@angular/core").InputSignal<"outline" | "solid" | "subtle" | "dot" | BadgeVariant>;
    readonly color: import("@angular/core").InputSignal<"primary" | "danger" | "success" | "warning" | "info" | "neutral" | BadgeColor>;
    readonly pill: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly displayCount: import("@angular/core").Signal<string | number | undefined>;
    readonly isHidden: import("@angular/core").Signal<boolean>;
    readonly cornerClass: import("@angular/core").Signal<string>;
    readonly dotColorClass: import("@angular/core").Signal<string>;
    readonly badgeClasses: import("@angular/core").Signal<string>;
}
