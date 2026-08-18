import { Injectable, signal } from '@angular/core';
import { ToastItem, ToastOptions } from './toast.model';
import { ToastPosition, ToastType } from '../../enums/component.enum';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastItem[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  private positionSignal = signal<ToastPosition | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'>(ToastPosition.TOP_RIGHT);
  readonly position = this.positionSignal.asReadonly();

  setPosition(pos: ToastPosition | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'): void {
    this.positionSignal.set(pos);
  }

  show(options: ToastOptions): string {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: ToastItem = {
      id,
      type: options.type || ToastType.INFO,
      title: options.title || '',
      message: options.message,
      duration: options.duration !== undefined ? options.duration : 4000,
      showProgress: options.showProgress !== undefined ? options.showProgress : true,
      icon: options.icon,
      actionText: options.actionText,
      onAction: options.onAction,
      onClose: options.onClose,
      createdAt: Date.now()
    };

    this.toastsSignal.update(list => [...list, newItem]);

    if (newItem.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newItem.duration);
    }

    return id;
  }

  success(message: string, title?: string, duration?: number): string {
    return this.show({ type: ToastType.SUCCESS, message, title, duration });
  }

  error(message: string, title?: string, duration?: number): string {
    return this.show({ type: ToastType.ERROR, message, title, duration: duration !== undefined ? duration : 5000 });
  }

  warning(message: string, title?: string, duration?: number): string {
    return this.show({ type: ToastType.WARNING, message, title, duration });
  }

  info(message: string, title?: string, duration?: number): string {
    return this.show({ type: ToastType.INFO, message, title, duration });
  }

  loading(message: string, title?: string): string {
    return this.show({ type: ToastType.LOADING, message, title, duration: 0 });
  }

  dismiss(id: string): void {
    const item = this.toastsSignal().find(t => t.id === id);
    if (item?.onClose) {
      item.onClose();
    }
    this.toastsSignal.update(list => list.filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSignal.set([]);
  }
}
