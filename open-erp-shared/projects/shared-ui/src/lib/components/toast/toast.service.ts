import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title?: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 0;
  toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'info', title?: string, duration = 3000): void {
    const id = this.nextId++;
    const toast: Toast = { id, message, type, title, duration };
    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  showSuccess(message: string, title?: string, duration = 3000): void {
    this.show(message, 'success', title, duration);
  }

  showWarning(message: string, title?: string, duration = 3000): void {
    this.show(message, 'warning', title, duration);
  }

  showError(message: string, title?: string, duration = 3000): void {
    this.show(message, 'error', title, duration);
  }

  showInfo(message: string, title?: string, duration = 3000): void {
    this.show(message, 'info', title, duration);
  }

  remove(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
