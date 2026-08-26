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
    readonly brandTitle: import("@angular/core").InputSignal<string>;
    readonly brandSubtitle: import("@angular/core").InputSignal<string | undefined>;
    readonly brandLogo: import("@angular/core").InputSignal<string | undefined>;
    readonly brandUrl: import("@angular/core").InputSignal<string>;
    readonly position: import("@angular/core").InputSignal<"static" | "sticky" | "fixed" | NavbarPosition>;
    readonly bordered: import("@angular/core").InputSignal<boolean>;
    readonly glass: import("@angular/core").InputSignal<boolean>;
    readonly items: import("@angular/core").InputSignal<NavbarItem[]>;
    readonly showMobileToggle: import("@angular/core").InputSignal<boolean>;
    readonly mobileOpen: import("@angular/core").ModelSignal<boolean>;
    readonly mobileToggle: import("@angular/core").OutputEmitterRef<boolean>;
    readonly itemClick: import("@angular/core").OutputEmitterRef<NavbarItem>;
    readonly positionClass: import("@angular/core").Signal<string>;
    onToggleMobile(): void;
    onItemClick(item: NavbarItem, event?: MouseEvent): void;
}
