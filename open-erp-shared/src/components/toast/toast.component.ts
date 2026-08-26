import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { ToastItem } from './toast.model';
import { ToastType } from '../../enums/component.enum';

const TOAST_ICONS: Record<string, IconName> = {
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'alert-circle',
  loading: 'loader',
  info: 'info'
};

const TOAST_CONTAINER_CLASSES: Record<string, string> = {
  success: 'bg-white/95 dark:bg-slate-900/95 border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100 shadow-emerald-500/10',
  warning: 'bg-white/95 dark:bg-slate-900/95 border-amber-200 dark:border-amber-800/60 text-slate-900 dark:text-slate-100 shadow-amber-500/10',
  error: 'bg-white/95 dark:bg-slate-900/95 border-rose-200 dark:border-rose-800/60 text-slate-900 dark:text-slate-100 shadow-rose-500/10',
  loading: 'bg-white/95 dark:bg-slate-900/95 border-indigo-200 dark:border-indigo-800/60 text-slate-900 dark:text-slate-100 shadow-indigo-500/10',
  info: 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-slate-900/10'
};

const TOAST_ICON_COLOR_CLASSES: Record<string, string> = {
  success: 'text-emerald-500 dark:text-emerald-400',
  warning: 'text-amber-500 dark:text-amber-400',
  error: 'text-rose-500 dark:text-rose-400',
  info: 'text-indigo-500 dark:text-indigo-400'
};

const TOAST_PROGRESS_COLORS: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  info: 'bg-indigo-500'
};

@Component({
  selector: 'erp-toast',
  standalone: true,
  imports: [CommonModule, IconComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClasses()"
         class="group relative flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 w-80 sm:w-96 overflow-hidden">
      
      <!-- Icon / Loading Spinner -->
      <div class="shrink-0 mt-0.5">
        @if (toast().type === 'loading') {
          <erp-spinner size="sm" variant="spin"></erp-spinner>
        } @else {
          <div [class]="iconColorClass()">
            <erp-icon [name]="iconName()" [size]="20"></erp-icon>
          </div>
        }
      </div>

      <!-- Toast Content -->
      <div class="flex-1 min-w-0">
        @if (toast().title) {
          <h4 class="text-xs font-bold text-slate-900 dark:text-white tracking-tight mb-0.5">{{ toast().title }}</h4>
        }
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ toast().message }}</p>

        <!-- Optional Action Button -->
        @if (toast().actionText && toast().onAction) {
          <button (click)="toast().onAction?.(); close.emit()"
                  type="button"
                  class="mt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer">
            {{ toast().actionText }}
          </button>
        }
      </div>

      <!-- Dismiss Close Button -->
      <button (click)="close.emit()"
              type="button"
              class="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Đóng">
        <erp-icon name="x" [size]="14"></erp-icon>
      </button>

      <!-- Progress Timer Bar -->
      @if (toast().duration > 0 && toast().showProgress) {
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div class="h-full transition-all linear"
               [class]="progressBarColor()"
               [style.animation]="'toast-progress ' + toast().duration + 'ms linear forwards'">
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toast-progress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class ToastComponent {
  readonly toast = input.required<ToastItem>();
  readonly close = output<void>();

  readonly iconName = computed<IconName>(() => {
    const t = this.toast().type;
    return TOAST_ICONS[t] || 'info';
  });

  readonly containerClasses = computed(() => {
    const t = this.toast().type;
    return TOAST_CONTAINER_CLASSES[t] || TOAST_CONTAINER_CLASSES['info'];
  });

  readonly iconColorClass = computed(() => {
    const t = this.toast().type;
    return TOAST_ICON_COLOR_CLASSES[t] || TOAST_ICON_COLOR_CLASSES['info'];
  });

  readonly progressBarColor = computed(() => {
    const t = this.toast().type;
    return TOAST_PROGRESS_COLORS[t] || TOAST_PROGRESS_COLORS['info'];
  });
}
