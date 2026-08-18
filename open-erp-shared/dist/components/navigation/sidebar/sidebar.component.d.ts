import { EventEmitter } from '@angular/core';
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
    mode: SidebarMode | 'fixed' | 'mini' | 'overlay';
    collapsed: boolean;
    openOverlay: boolean;
    brandTitle: string;
    brandSubtitle?: string;
    brandLogo?: string;
    brandUrl: string;
    items: SidebarItem[];
    showCollapseToggle: boolean;
    width: string;
    collapsedChange: EventEmitter<boolean>;
    openOverlayChange: EventEmitter<boolean>;
    itemClick: EventEmitter<SidebarSubItem | SidebarItem>;
    toggleCollapse(): void;
    closeDrawer(): void;
    toggleItemExpand(item: SidebarItem, event: MouseEvent): void;
    onItemClick(item: SidebarItem | SidebarSubItem, event?: MouseEvent): void;
    get isOverlay(): boolean;
    get isMini(): boolean;
    isItemActive(item: SidebarItem): boolean;
}
