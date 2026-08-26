import { ElementRef, AfterViewInit } from '@angular/core';
export declare class FocusTrapDirective implements AfterViewInit {
    private el;
    readonly enabled: import("@angular/core").InputSignal<boolean>;
    private focusableSelector;
    constructor(el: ElementRef);
    ngAfterViewInit(): void;
    onKeyDown(event: KeyboardEvent): void;
    private getFocusableElements;
    private focusFirstElement;
}
