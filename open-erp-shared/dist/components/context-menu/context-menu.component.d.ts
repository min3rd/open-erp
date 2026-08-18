import { EventEmitter, ElementRef } from '@angular/core';
import { IconName } from '../icon/icon.component';
export interface ContextMenuItem {
    id?: string;
    label: string;
    icon?: IconName;
    disabled?: boolean;
    danger?: boolean;
    divider?: boolean;
    shortcut?: string;
    action?: () => void;
}
export declare class ContextMenuComponent {
    private elementRef;
    items: ContextMenuItem[];
    disabled: boolean;
    itemClick: EventEmitter<ContextMenuItem>;
    isOpen: boolean;
    posX: number;
    posY: number;
    constructor(elementRef: ElementRef);
    onDocumentClick(): void;
    onDocumentScroll(): void;
    onContextMenu(event: MouseEvent): void;
    handleItemClick(item: ContextMenuItem): void;
}
