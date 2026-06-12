import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from './toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-toast-container',
  standalone: true,
  imports: [NgClass, IconComponent],
  template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          [ngClass]="[
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-x-0 ease-out bg-white dark:bg-slate-900',
            getClasses(toast.type)
          ]"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <oerp-icon [name]="getIconName(toast.type)" [size]="20" [color]="getIconColor(toast.type)"></oerp-icon>
          </div>

          <!-- Content -->
          <div class="flex-grow flex flex-col gap-0.5 text-sm">
            @if (toast.title) {
              <h5 [ngClass]="['font-semibold', getTitleColorClass(toast.type)]">{{ toast.title }}</h5>
            }
            <p class="text-slate-600 dark:text-slate-355 leading-normal">{{ toast.message }}</p>
          </div>

          <!-- Close button -->
          <button 
            (click)="toastService.remove(toast.id)"
            class="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors outline-none cursor-pointer flex items-center justify-center"
          >
            <oerp-icon name="x" [size]="18"></oerp-icon>
          </button>
        </div>
      }
    </div>
  `
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
