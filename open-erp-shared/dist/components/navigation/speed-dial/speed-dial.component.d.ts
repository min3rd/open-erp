import { EventEmitter, ElementRef } from '@angular/core';
import { IconName } from '../../icon/icon.component';
import { SpeedDialDirection, SpeedDialPosition } from '../../../enums/component.enum';
export interface SpeedDialAction {
    id: string;
    label?: string;
    icon: IconName;
    color?: string;
    disabled?: boolean;
}
export declare class SpeedDialComponent {
    private elementRef;
    items: SpeedDialAction[];
    icon: IconName;
    activeIcon: IconName;
    direction: SpeedDialDirection | 'up' | 'down' | 'left' | 'right';
    position: SpeedDialPosition | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    open: boolean;
    showBackdrop: boolean;
    showLabels: boolean;
    fixed: boolean;
    actionClick: EventEmitter<SpeedDialAction>;
    openChange: EventEmitter<boolean>;
    constructor(elementRef: ElementRef);
    onDocumentClick(event: MouseEvent): void;
    toggle(): void;
    close(): void;
    onActionClick(action: SpeedDialAction, event: MouseEvent): void;
    getPositionClasses(): string;
    get isVerticalDirection(): boolean;
    get isHorizontalDirection(): boolean;
    getDirectionContainerClasses(): string;
}
