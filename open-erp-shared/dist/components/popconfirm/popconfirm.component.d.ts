import { ElementRef } from '@angular/core';
import { ButtonVariant, PopoverPlacement } from '../../enums/component.enum';
export declare class PopconfirmComponent {
    private elementRef;
    readonly title: import("@angular/core").InputSignal<string>;
    readonly description: import("@angular/core").InputSignal<string | undefined>;
    readonly okText: import("@angular/core").InputSignal<string>;
    readonly cancelText: import("@angular/core").InputSignal<string>;
    readonly okVariant: import("@angular/core").InputSignal<"primary" | "danger" | ButtonVariant>;
    readonly icon: import("@angular/core").InputSignal<string>;
    readonly placement: import("@angular/core").InputSignal<"left" | "right" | "top" | "bottom" | PopoverPlacement>;
    readonly confirm: import("@angular/core").OutputEmitterRef<void>;
    readonly cancel: import("@angular/core").OutputEmitterRef<void>;
    isOpen: import("@angular/core").WritableSignal<boolean>;
    constructor(elementRef: ElementRef);
    readonly placementClasses: import("@angular/core").Signal<string>;
    onDocumentClick(event: MouseEvent): void;
    toggleOpen(event: MouseEvent): void;
    onConfirm(): void;
    onCancel(): void;
}
