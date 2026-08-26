import { IconName } from '../../icon/icon.component';
export interface BottomNavItem {
    id: string;
    label: string;
    icon: IconName;
    activeIcon?: IconName;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
}
export declare class BottomNavComponent {
    readonly items: import("@angular/core").InputSignal<BottomNavItem[]>;
    readonly activeId: import("@angular/core").ModelSignal<string | undefined>;
    readonly fixed: import("@angular/core").InputSignal<boolean>;
    readonly safeArea: import("@angular/core").InputSignal<boolean>;
    readonly floating: import("@angular/core").InputSignal<boolean>;
    readonly showLabels: import("@angular/core").InputSignal<boolean>;
    readonly itemClick: import("@angular/core").OutputEmitterRef<BottomNavItem>;
    readonly currentActiveId: import("@angular/core").Signal<string>;
    onItemSelect(item: BottomNavItem): void;
}
