import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'oerp-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span 
      [ngClass]="[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold select-none leading-4 tracking-wider uppercase',
        getColorClasses()
      ]"
    >
      {{ label() }}
    </span>
  `
})
export class BadgeComponent {
  label = input.required<string>();
  color = input<'primary' | 'success' | 'warning' | 'danger' | 'info'>('primary');

  getColorClasses(): string {
    switch (this.color()) {
      case 'primary':
        return 'bg-rose-gold-50 text-rose-gold-600 dark:bg-rose-gold-900/30 dark:text-rose-gold-400 border border-rose-gold-100 dark:border-rose-gold-800/50';
      case 'success':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
      case 'warning':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
      case 'danger':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50';
      case 'info':
        return 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  }
}
