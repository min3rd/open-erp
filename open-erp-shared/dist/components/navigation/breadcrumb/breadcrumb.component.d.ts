import { IconName } from '../../icon/icon.component';
export interface BreadcrumbItem {
    id?: string;
    label: string;
    url?: string;
    icon?: IconName;
    active?: boolean;
    disabled?: boolean;
}
export declare class BreadcrumbComponent {
    readonly items: import("@angular/core").InputSignal<(string | BreadcrumbItem)[]>;
    readonly separator: import("@angular/core").InputSignal<string>;
    readonly maxItems: import("@angular/core").InputSignal<number | undefined>;
    readonly showHomeIcon: import("@angular/core").InputSignal<boolean>;
    readonly homeIcon: import("@angular/core").InputSignal<string>;
    readonly homeUrl: import("@angular/core").InputSignal<string>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly itemClick: import("@angular/core").OutputEmitterRef<BreadcrumbItem>;
    isExpandedCollapsed: import("@angular/core").WritableSignal<boolean>;
    readonly normalizedItems: import("@angular/core").Signal<BreadcrumbItem[]>;
    readonly displayItems: import("@angular/core").Signal<{
        item: BreadcrumbItem;
        isEllipsis?: boolean;
        originalIndex: number;
    }[]>;
    onItemClick(item: BreadcrumbItem, event: MouseEvent): void;
    expandEllipsis(): void;
}
