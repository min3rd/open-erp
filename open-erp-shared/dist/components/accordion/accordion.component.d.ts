import { EventEmitter } from '@angular/core';
import { IconName } from '../icon/icon.component';
export interface AccordionItem {
    id?: string;
    title: string;
    subtitle?: string;
    content?: string;
    icon?: IconName;
    badge?: string | number;
    badgeColor?: string;
    expanded?: boolean;
    disabled?: boolean;
}
export declare class AccordionComponent {
    items: AccordionItem[];
    expandMultiple: boolean;
    bordered: boolean;
    ghost: boolean;
    itemToggle: EventEmitter<{
        item: AccordionItem;
        index: number;
        expanded: boolean;
    }>;
    toggleItem(item: AccordionItem, index: number): void;
}
