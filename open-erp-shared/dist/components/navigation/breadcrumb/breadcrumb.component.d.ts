import { EventEmitter } from '@angular/core';
import { IconName } from '../../icon/icon.component';
import { BreadcrumbSeparator } from '../../../enums/component.enum';
export interface BreadcrumbItem {
    id?: string;
    label: string;
    url?: string;
    icon?: IconName;
    active?: boolean;
    disabled?: boolean;
}
export declare class BreadcrumbComponent {
    items: (string | BreadcrumbItem)[];
    separator: BreadcrumbSeparator | 'slash' | 'chevron' | 'arrow' | 'dot' | string;
    maxItems?: number;
    showHomeIcon: boolean;
    homeIcon: IconName;
    homeUrl: string;
    loading: boolean;
    itemClick: EventEmitter<BreadcrumbItem>;
    isExpandedCollapsed: boolean;
    get normalizedItems(): BreadcrumbItem[];
    get displayItems(): {
        item: BreadcrumbItem;
        isEllipsis?: boolean;
        originalIndex: number;
    }[];
    onItemClick(item: BreadcrumbItem, event: MouseEvent): void;
    expandEllipsis(): void;
}
