import { ElementRef } from '@angular/core';
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
    readonly items: import("@angular/core").InputSignal<SpeedDialAction[]>;
    readonly icon: import("@angular/core").InputSignal<string>;
    readonly activeIcon: import("@angular/core").InputSignal<string>;
    readonly direction: import("@angular/core").InputSignal<"up" | "down" | "left" | "right" | SpeedDialDirection>;
    readonly position: import("@angular/core").InputSignal<"bottom-right" | "bottom-left" | "top-right" | "top-left" | SpeedDialPosition>;
    readonly open: import("@angular/core").ModelSignal<boolean>;
    readonly showBackdrop: import("@angular/core").InputSignal<boolean>;
    readonly showLabels: import("@angular/core").InputSignal<boolean>;
    readonly fixed: import("@angular/core").InputSignal<boolean>;
    readonly actionClick: import("@angular/core").OutputEmitterRef<SpeedDialAction>;
    constructor(elementRef: ElementRef);
    readonly positionClass: import("@angular/core").Signal<string>;
    readonly isVerticalDirection: import("@angular/core").Signal<boolean>;
    readonly isHorizontalDirection: import("@angular/core").Signal<boolean>;
    readonly directionContainerClass: import("@angular/core").Signal<string>;
    onDocumentClick(event: MouseEvent): void;
    toggle(): void;
    close(): void;
    onActionClick(action: SpeedDialAction, event: MouseEvent): void;
}
