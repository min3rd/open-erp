import { EventEmitter } from '@angular/core';
import { IconName } from '../../icon/icon.component';
import { NavbarPosition } from '../../../enums/component.enum';
export interface NavbarItem {
    id?: string;
    label: string;
    url?: string;
    icon?: IconName;
    active?: boolean;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
    children?: NavbarItem[];
}
export declare class NavbarComponent {
    brandTitle: string;
    brandSubtitle?: string;
    brandLogo?: string;
    brandUrl: string;
    position: NavbarPosition | 'static' | 'sticky' | 'fixed';
    bordered: boolean;
    glass: boolean;
    items: NavbarItem[];
    showMobileToggle: boolean;
    mobileOpen: boolean;
    mobileToggle: EventEmitter<boolean>;
    itemClick: EventEmitter<NavbarItem>;
    onToggleMobile(): void;
    onItemClick(item: NavbarItem, event?: MouseEvent): void;
    getPositionClasses(): string;
}
