import { IconName } from '../../icon/icon.component';
import { SidebarMode } from '../../../enums/component.enum';
export interface SidebarSubItem {
    id: string;
    label: string;
    url?: string;
    icon?: IconName;
    active?: boolean;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
}
export interface SidebarItem {
    id?: string;
    label?: string;
    url?: string;
    icon?: IconName;
    active?: boolean;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
    expanded?: boolean;
    children?: SidebarSubItem[];
    sectionHeader?: string;
}
export declare class SidebarComponent {
    readonly mode: import("@angular/core").InputSignal<"fixed" | "mini" | "overlay" | SidebarMode>;
    readonly collapsed: import("@angular/core").ModelSignal<boolean>;
    readonly openOverlay: import("@angular/core").ModelSignal<boolean>;
    readonly brandTitle: import("@angular/core").InputSignal<string>;
    readonly brandSubtitle: import("@angular/core").InputSignal<string | undefined>;
    readonly brandLogo: import("@angular/core").InputSignal<string | undefined>;
    readonly brandUrl: import("@angular/core").InputSignal<string>;
    readonly items: import("@angular/core").InputSignal<SidebarItem[]>;
    readonly showCollapseToggle: import("@angular/core").InputSignal<boolean>;
    readonly width: import("@angular/core").InputSignal<string>;
    readonly itemClick: import("@angular/core").OutputEmitterRef<SidebarSubItem | SidebarItem>;
    readonly isOverlay: import("@angular/core").Signal<boolean>;
    readonly isMini: import("@angular/core").Signal<boolean>;
    toggleCollapse(): void;
    closeDrawer(): void;
    toggleItemExpand(item: SidebarItem, event: MouseEvent): void;
    onItemClick(item: SidebarItem | SidebarSubItem, event?: MouseEvent): void;
    isItemActive(item: SidebarItem): boolean;
}
