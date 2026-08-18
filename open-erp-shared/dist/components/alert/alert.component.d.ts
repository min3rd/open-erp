import { EventEmitter } from '@angular/core';
import { IconName } from '../icon/icon.component';
import { AlertVariant } from '../../enums/component.enum';
export declare class AlertComponent {
    variant: AlertVariant | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    title?: string;
    message?: string;
    icon?: IconName;
    showIcon: boolean;
    closable: boolean;
    banner: boolean;
    bordered: boolean;
    closed: EventEmitter<void>;
    visible: boolean;
    get defaultIcon(): IconName;
    get containerClasses(): string;
    get iconClasses(): string;
    close(): void;
}
