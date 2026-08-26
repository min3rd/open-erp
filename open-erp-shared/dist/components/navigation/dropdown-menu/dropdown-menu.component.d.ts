import { ElementRef } from '@angular/core';
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
    readonly items: import("@angular/core").InputSignal<DropdownMenuItem[]>;
    readonly placement: import("@angular/core").InputSignal<"bottom-start" | "bottom-end" | "top-start" | "top-end" | "left" | "right" | DropdownPlacement>;
    readonly trigger: import("@angular/core").InputSignal<"click" | "hover">;
    readonly isOpen: import("@angular/core").ModelSignal<boolean>;
    readonly closeOnClickOutside: import("@angular/core").InputSignal<boolean>;
    readonly closeOnItemClick: import("@angular/core").InputSignal<boolean>;
    readonly minWidth: import("@angular/core").InputSignal<string>;
    readonly itemClick: import("@angular/core").OutputEmitterRef<DropdownMenuItem>;
    activeIndex: import("@angular/core").WritableSignal<number>;
    constructor(elementRef: ElementRef);
    readonly placementClasses: import("@angular/core").Signal<string>;
    readonly actionableItems: import("@angular/core").Signal<DropdownMenuItem[]>;
    onDocumentClick(event: MouseEvent): void;
    onKeyDown(event: KeyboardEvent): void;
    toggle(): void;
    open(): void;
    close(): void;
    onMouseEnter(): void;
    onMouseLeave(): void;
    onItemSelect(item: DropdownMenuItem, event: MouseEvent | KeyboardEvent): void;
}
