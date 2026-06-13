import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from './toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-toast-container',
  standalone: true,
  imports: [NgClass, IconComponent],
  templateUrl: './toast.component.html'
})
export class ToastComponent {
  toastService = inject(ToastService);

  getClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/90 dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/50';
      case 'warning':
        return 'bg-amber-50/90 dark:bg-slate-900 border-amber-100 dark:border-amber-900/50';
      case 'error':
        return 'bg-rose-50/90 dark:bg-slate-900 border-rose-100 dark:border-rose-900/50';
      case 'info':
      default:
        return 'bg-sky-50/90 dark:bg-slate-900 border-sky-100 dark:border-sky-900/50';
    }
  }

  getTitleColorClass(type: string): string {
    switch (type) {
      case 'success': return 'text-emerald-900 dark:text-emerald-400';
      case 'warning': return 'text-amber-900 dark:text-amber-400';
      case 'error': return 'text-rose-900 dark:text-rose-400';
      case 'info':
      default: return 'text-sky-900 dark:text-sky-400';
    }
  }

  getIconName(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'alert-triangle';
      case 'error': return 'alert-octagon';
      case 'info':
      default: return 'info';
    }
  }

  getIconColor(type: string): string {
    switch (type) {
      case 'success': return '#10b981'; // emerald-500
      case 'warning': return '#f59e0b'; // amber-500
      case 'error': return '#e11d48'; // rose-500
      case 'info':
      default: return '#0ea5e9'; // sky-500
    }
  }
}
