import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-alert',
  standalone: true,
  imports: [NgClass, IconComponent],
  templateUrl: './alert.component.html'
})
export class AlertComponent {
  title = input<string>('');
  message = input.required<string>();
  type = input<'success' | 'warning' | 'error' | 'info'>('info');

  getClasses(): string {
    switch (this.type()) {
      case 'success':
        return 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30';
      case 'warning':
        return 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30';
      case 'error':
        return 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30';
      case 'info':
      default:
        return 'bg-sky-50/50 dark:bg-sky-950/10 border-sky-100 dark:border-sky-900/30';
    }
  }

  getTitleColorClass(): string {
    switch (this.type()) {
      case 'success':
        return 'text-emerald-900 dark:text-emerald-400';
      case 'warning':
        return 'text-amber-900 dark:text-amber-400';
      case 'error':
        return 'text-rose-900 dark:text-rose-400';
      case 'info':
      default:
        return 'text-sky-900 dark:text-sky-400';
    }
  }

  getIconName(): string {
    switch (this.type()) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert-triangle';
      case 'error':
        return 'alert-octagon';
      case 'info':
      default:
        return 'info';
    }
  }

  getIconColor(): string {
    switch (this.type()) {
      case 'success':
        return '#10b981'; // emerald-500
      case 'warning':
        return '#f59e0b'; // amber-500
      case 'error':
        return '#e11d48'; // rose-500
      case 'info':
      default:
        return '#0ea5e9'; // sky-500
    }
  }
}
