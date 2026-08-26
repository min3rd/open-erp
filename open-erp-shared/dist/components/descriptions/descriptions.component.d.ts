import { IconName } from '../icon/icon.component';
import { DescriptionsLayout } from '../../enums/component.enum';
export interface DescriptionItem {
    label: string;
    value?: any;
    span?: number;
    icon?: IconName;
    badge?: string;
    badgeColor?: string;
}
export declare class DescriptionsComponent {
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly items: import("@angular/core").InputSignal<DescriptionItem[]>;
    readonly column: import("@angular/core").InputSignal<number>;
    readonly bordered: import("@angular/core").InputSignal<boolean>;
    readonly layout: import("@angular/core").InputSignal<"horizontal" | "vertical" | DescriptionsLayout>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg">;
    readonly gridColsClass: import("@angular/core").Signal<"grid-cols-1" | "grid-cols-1 sm:grid-cols-2" | "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" | "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">;
    readonly sizeClass: import("@angular/core").Signal<string>;
}
