import { ElementRef, AfterViewInit } from '@angular/core';
export declare class FocusTrapDirective implements AfterViewInit {
    private el;
    enabled: boolean;
    private focusableSelector;
    constructor(el: ElementRef);
    ngAfterViewInit(): void;
    onKeyDown(event: KeyboardEvent): void;
    private getFocusableElements;
    private focusFirstElement;
}
