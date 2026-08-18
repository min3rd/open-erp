import { ToastItem, ToastOptions } from './toast.model';
import { ToastPosition } from '../../enums/component.enum';
export declare class ToastService {
    private toastsSignal;
    readonly toasts: import("@angular/core").Signal<ToastItem[]>;
    private positionSignal;
    readonly position: import("@angular/core").Signal<"bottom-right" | "bottom-left" | "top-right" | "top-left" | "top-center" | "bottom-center" | ToastPosition>;
    setPosition(pos: ToastPosition | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'): void;
    show(options: ToastOptions): string;
    success(message: string, title?: string, duration?: number): string;
    error(message: string, title?: string, duration?: number): string;
    warning(message: string, title?: string, duration?: number): string;
    info(message: string, title?: string, duration?: number): string;
    loading(message: string, title?: string): string;
    dismiss(id: string): void;
    clear(): void;
}
