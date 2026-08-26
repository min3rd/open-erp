import { ElementRef } from '@angular/core';
export declare class ClickOutsideDirective {
    private elementRef;
    readonly clickOutsideEnabled: import("@angular/core").InputSignal<boolean>;
    readonly clickOutside: import("@angular/core").OutputEmitterRef<MouseEvent>;
    constructor(elementRef: ElementRef);
    onDocumentClick(event: MouseEvent): void;
}
