import { EventEmitter, ElementRef } from '@angular/core';
import { IconName } from '../../icon/icon.component';
import { DropdownPlacement } from '../../../enums/component.enum';
export interface DropdownMenuItem {
    id?: string;
    label?: string;
    icon?: IconName;
    iconColor?: string;
    shortcut?: string;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
    danger?: boolean;
    divider?: boolean;
    header?: string;
}
export declare class DropdownMenuComponent {
    private elementRef;
    items: DropdownMenuItem[];
    placement: DropdownPlacement | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right';
    trigger: 'click' | 'hover';
    isOpen: boolean;
    closeOnClickOutside: boolean;
    closeOnItemClick: boolean;
    minWidth: string;
    isOpenChange: EventEmitter<boolean>;
    itemClick: EventEmitter<DropdownMenuItem>;
    constructor(elementRef: ElementRef);
    onDocumentClick(event: MouseEvent): void;
    toggle(): void;
    open(): void;
    close(): void;
    onMouseEnter(): void;
    onMouseLeave(): void;
    onItemSelect(item: DropdownMenuItem, event: MouseEvent): void;
    getPlacementClasses(): string;
}
