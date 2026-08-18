import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { AlertVariant } from '../../enums/component.enum';

@Component({
  selector: 'erp-alert, erp-banner',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './alert.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class AlertComponent {
  @Input() variant: AlertVariant | 'info' | 'success' | 'warning' | 'error' | 'neutral' = AlertVariant.INFO;
  @Input() title?: string;
  @Input() message?: string;
  @Input() icon?: IconName;
  @Input() showIcon: boolean = true;
  @Input() closable: boolean = false;
  @Input() banner: boolean = false;
  @Input() bordered: boolean = true;

  @Output() closed = new EventEmitter<void>();

  visible: boolean = true;

  get defaultIcon(): IconName {
    if (this.icon) return this.icon;
    switch (this.variant) {
      case 'success':
      case AlertVariant.SUCCESS:
        return 'check-circle';
      case 'warning':
      case AlertVariant.WARNING:
        return 'alert-triangle';
      case 'error':
      case AlertVariant.ERROR:
        return 'alert-circle';
      case 'neutral':
      case AlertVariant.NEUTRAL:
        return 'info';
      case 'info':
      case AlertVariant.INFO:
      default:
        return 'info';
    }
  }

  get containerClasses(): string {
    const base = 'relative transition-all duration-200';
    const shape = this.banner ? 'rounded-none px-6 py-3.5' : 'rounded-2xl p-4';
    const border = this.bordered ? 'border' : 'border-0';

    switch (this.variant) {
      case 'success':
      case AlertVariant.SUCCESS:
        return `${base} ${shape} ${border} bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200`;
      case 'warning':
      case AlertVariant.WARNING:
        return `${base} ${shape} ${border} bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200`;
      case 'error':
      case AlertVariant.ERROR:
        return `${base} ${shape} ${border} bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200`;
      case 'neutral':
      case AlertVariant.NEUTRAL:
        return `${base} ${shape} ${border} bg-slate-100/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200`;
      case 'info':
      case AlertVariant.INFO:
      default:
        return `${base} ${shape} ${border} bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200`;
    }
  }

  get iconClasses(): string {
    switch (this.variant) {
      case 'success':
      case AlertVariant.SUCCESS:
        return 'text-emerald-600 dark:text-emerald-400';
      case 'warning':
      case AlertVariant.WARNING:
        return 'text-amber-600 dark:text-amber-400';
      case 'error':
      case AlertVariant.ERROR:
        return 'text-rose-600 dark:text-rose-400';
      case 'neutral':
      case AlertVariant.NEUTRAL:
        return 'text-slate-600 dark:text-slate-400';
      case 'info':
      case AlertVariant.INFO:
      default:
        return 'text-indigo-600 dark:text-indigo-400';
    }
  }

  close(): void {
    this.visible = false;
    this.closed.emit();
  }
}
