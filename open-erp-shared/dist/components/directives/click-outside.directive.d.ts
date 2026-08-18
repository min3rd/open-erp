import { ElementRef, EventEmitter } from '@angular/core';
export declare class ClickOutsideDirective {
    private elementRef;
    clickOutsideEnabled: boolean;
    clickOutside: EventEmitter<MouseEvent>;
    constructor(elementRef: ElementRef);
    onDocumentClick(event: MouseEvent): void;
}
