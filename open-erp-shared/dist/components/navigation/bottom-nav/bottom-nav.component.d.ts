import { EventEmitter } from '@angular/core';
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
    items: BottomNavItem[];
    activeId?: string;
    fixed: boolean;
    safeArea: boolean;
    floating: boolean;
    showLabels: boolean;
    itemClick: EventEmitter<BottomNavItem>;
    activeIdChange: EventEmitter<string>;
    get currentActiveId(): string;
    onItemSelect(item: BottomNavItem): void;
}
