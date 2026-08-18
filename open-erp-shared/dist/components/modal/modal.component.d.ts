import { EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { IconName } from '../icon/icon.component';
import { ModalSize } from '../../enums/component.enum';
export declare class ModalComponent implements OnChanges {
    visible: boolean;
    title?: string;
    subtitle?: string;
    icon?: IconName;
    size: ModalSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closable: boolean;
    maskClosable: boolean;
    showFooter: boolean;
    okText: string;
    cancelText: string;
    okLoading: boolean;
    centered: boolean;
    visibleChange: EventEmitter<boolean>;
    ok: EventEmitter<void>;
    cancel: EventEmitter<void>;
    onEscape(): void;
    ngOnChanges(changes: SimpleChanges): void;
    get sizeClasses(): string;
    close(): void;
    onMaskClick(event: MouseEvent): void;
    handleOk(): void;
}
