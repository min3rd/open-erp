import { ToastType } from '../../enums/component.enum';
import { IconName } from '../icon/icon.component';
export interface ToastOptions {
    id?: string;
    type?: ToastType | 'info' | 'success' | 'warning' | 'error' | 'loading';
    title?: string;
    message: string;
    duration?: number;
    icon?: IconName;
    showProgress?: boolean;
    actionText?: string;
    onAction?: () => void;
    onClose?: () => void;
}
export interface ToastItem extends Required<Omit<ToastOptions, 'id' | 'icon' | 'actionText' | 'onAction' | 'onClose'>> {
    id: string;
    icon?: IconName;
    actionText?: string;
    onAction?: () => void;
    onClose?: () => void;
    createdAt: number;
}
