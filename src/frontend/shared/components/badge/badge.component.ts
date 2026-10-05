import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorVariant, ShapeVariant } from '../../enums';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html'
})
export class BadgeComponent {
  variant = input<ColorVariant | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default'>(ColorVariant.DEFAULT);
  /** Explicit override; the default follows the theme control radius token. */
  shape = input<ShapeVariant | 'sharp' | 'soft'>(ShapeVariant.SOFT);

  badgeClasses(): string {
    const shape = this.shape() as string;
    const shapeCls = shape === ShapeVariant.SHARP || shape === 'sharp' ? 'rounded-none' : 'rounded-control';
    const base = `inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium ${shapeCls} uppercase tracking-wider border`;
    const v = this.variant() as string;
    switch (v) {
      case ColorVariant.SUCCESS:
      case 'success':
        return `${base} bg-success/10 text-success border-success/40`;
      case ColorVariant.WARNING:
      case 'warning':
        return `${base} bg-warning/10 text-warning border-warning/40`;
      case ColorVariant.DANGER:
      case 'danger':
        return `${base} bg-danger/10 text-danger border-danger/40`;
      case ColorVariant.INFO:
      case 'info':
        return `${base} bg-accent/10 text-accent border-accent/40`;
      case ColorVariant.DEFAULT:
      case 'neutral':
      case 'default':
      default:
        return `${base} bg-surface-muted text-muted border-default`;
    }
  }
}
