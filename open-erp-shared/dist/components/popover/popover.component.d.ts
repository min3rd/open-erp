import { ElementRef } from '@angular/core';
import { PopoverPlacement, PopoverTrigger } from '../../enums/component.enum';
export declare class PopoverComponent {
    private elementRef;
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly content: import("@angular/core").InputSignal<string | undefined>;
    readonly placement: import("@angular/core").InputSignal<"left" | "right" | "top" | "bottom" | PopoverPlacement>;
    readonly trigger: import("@angular/core").InputSignal<"click" | "hover" | PopoverTrigger>;
    readonly width: import("@angular/core").InputSignal<string | undefined>;
    isOpen: import("@angular/core").WritableSignal<boolean>;
    private hoverTimeout;
    constructor(elementRef: ElementRef);
    readonly placementClasses: import("@angular/core").Signal<string>;
    onDocumentClick(event: MouseEvent): void;
    onTriggerClick(): void;
    onMouseEnter(): void;
    onMouseLeave(): void;
}
