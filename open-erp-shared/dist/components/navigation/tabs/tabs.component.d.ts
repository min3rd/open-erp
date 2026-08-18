import { EventEmitter } from '@angular/core';
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
    items: (string | TabItem)[];
    activeTabId?: string;
    variant: TabsVariant | 'line' | 'pills' | 'enclosed' | 'segmented';
    orientation: TabsOrientation | 'horizontal' | 'vertical';
    size: 'sm' | 'md' | 'lg';
    fullWidth: boolean;
    tabChange: EventEmitter<string>;
    activeTabIdChange: EventEmitter<string>;
    get normalizedItems(): TabItem[];
    get currentActiveId(): string;
    get isVertical(): boolean;
    get isLineVariant(): boolean;
    get isPillsOrSegmented(): boolean;
    selectTab(item: TabItem): void;
    getSizeClasses(): string;
    getItemClasses(item: TabItem): string;
}
