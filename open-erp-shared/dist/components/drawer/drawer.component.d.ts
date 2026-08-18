import { EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { IconName } from '../icon/icon.component';
import { DrawerPlacement, DrawerSize } from '../../enums/component.enum';
export declare class DrawerComponent implements OnChanges {
    visible: boolean;
    placement: DrawerPlacement | 'left' | 'right' | 'top' | 'bottom';
    size: DrawerSize | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    title?: string;
    subtitle?: string;
    icon?: IconName;
    closable: boolean;
    maskClosable: boolean;
    showFooter: boolean;
    okText: string;
    cancelText: string;
    visibleChange: EventEmitter<boolean>;
    close: EventEmitter<void>;
    ok: EventEmitter<void>;
    onEscape(): void;
    ngOnChanges(changes: SimpleChanges): void;
    get isHorizontal(): boolean;
    get placementClasses(): string;
    get sizeClasses(): string;
    handleClose(): void;
    onMaskClick(event: MouseEvent): void;
}
