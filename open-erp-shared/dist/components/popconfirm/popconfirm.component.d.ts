import { EventEmitter, ElementRef } from '@angular/core';
import { IconName } from '../icon/icon.component';
import { ButtonVariant, PopoverPlacement } from '../../enums/component.enum';
export declare class PopconfirmComponent {
    private elementRef;
    title: string;
    description?: string;
    okText: string;
    cancelText: string;
    okVariant: ButtonVariant | 'primary' | 'danger';
    icon: IconName;
    placement: PopoverPlacement | 'top' | 'bottom' | 'left' | 'right';
    confirm: EventEmitter<void>;
    cancel: EventEmitter<void>;
    isOpen: boolean;
    constructor(elementRef: ElementRef);
    onDocumentClick(event: MouseEvent): void;
    get placementClasses(): string;
    toggleOpen(event: MouseEvent): void;
    onConfirm(): void;
    onCancel(): void;
}
