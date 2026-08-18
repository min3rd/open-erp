import { EventEmitter } from '@angular/core';
import { IconName } from '../icon/icon.component';
import { ToastItem } from './toast.model';
export declare class ToastComponent {
    toast: ToastItem;
    close: EventEmitter<void>;
    get iconName(): IconName;
    get containerClasses(): string;
    get iconColorClass(): string;
    get progressBarColor(): string;
}
