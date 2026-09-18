import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorVariant, BadgeVariant } from '../../enums';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html'
})
export class BadgeComponent {
  variant = input<ColorVariant | BadgeVariant | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default'>(ColorVariant.DEFAULT);

  badgeClasses(): string {
    const base = 'inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-none uppercase tracking-wider border';
    const v = this.variant() as string;
    switch (v) {
      case ColorVariant.SUCCESS:
      case 'success':
        return `${base} bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800`;
      case ColorVariant.WARNING:
      case 'warning':
        return `${base} bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800`;
      case ColorVariant.DANGER:
      case 'danger':
        return `${base} bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800`;
      case ColorVariant.INFO:
      case 'info':
        return `${base} bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800`;
      case ColorVariant.DEFAULT:
      case 'neutral':
      case 'default':
      default:
        return `${base} bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700`;
    }
  }
}
