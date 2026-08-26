import { IconName } from '../../icon/icon.component';
import { TabsVariant, TabsOrientation } from '../../../enums/component.enum';
export interface TabItem {
    id: string;
    label: string;
    icon?: IconName;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
}
export declare class TabsComponent {
    readonly items: import("@angular/core").InputSignal<(string | TabItem)[]>;
    readonly activeTabId: import("@angular/core").ModelSignal<string | undefined>;
    readonly variant: import("@angular/core").InputSignal<"line" | "pills" | "enclosed" | "segmented" | TabsVariant>;
    readonly orientation: import("@angular/core").InputSignal<"horizontal" | "vertical" | TabsOrientation>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg">;
    readonly fullWidth: import("@angular/core").InputSignal<boolean>;
    readonly tabChange: import("@angular/core").OutputEmitterRef<string>;
    readonly normalizedItems: import("@angular/core").Signal<TabItem[]>;
    readonly currentActiveId: import("@angular/core").Signal<string>;
    readonly isVertical: import("@angular/core").Signal<boolean>;
    readonly isLineVariant: import("@angular/core").Signal<boolean>;
    readonly isPillsOrSegmented: import("@angular/core").Signal<boolean>;
    readonly sizeClass: import("@angular/core").Signal<string>;
    selectTab(item: TabItem): void;
    onKeyDown(event: KeyboardEvent, currentIndex: number): void;
    getItemClasses(item: TabItem): string;
}
