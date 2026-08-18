import { ElementRef } from '@angular/core';
import { PopoverPlacement, PopoverTrigger } from '../../enums/component.enum';
export declare class PopoverComponent {
    private elementRef;
    title?: string;
    content?: string;
    placement: PopoverPlacement | 'top' | 'bottom' | 'left' | 'right';
    trigger: PopoverTrigger | 'click' | 'hover';
    width?: string;
    isOpen: boolean;
    private hoverTimeout;
    constructor(elementRef: ElementRef);
    onDocumentClick(event: MouseEvent): void;
    get placementClasses(): string;
    onTriggerClick(): void;
    onMouseEnter(): void;
    onMouseLeave(): void;
}
