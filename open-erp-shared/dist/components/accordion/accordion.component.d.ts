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
    readonly items: import("@angular/core").InputSignal<AccordionItem[]>;
    readonly expandMultiple: import("@angular/core").InputSignal<boolean>;
    readonly bordered: import("@angular/core").InputSignal<boolean>;
    readonly ghost: import("@angular/core").InputSignal<boolean>;
    readonly itemToggle: import("@angular/core").OutputEmitterRef<{
        item: AccordionItem;
        index: number;
        expanded: boolean;
    }>;
    toggleItem(item: AccordionItem, index: number): void;
    onKeyDown(event: KeyboardEvent, item: AccordionItem, index: number): void;
}
