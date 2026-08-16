import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ButtonVariant, ButtonSize } from '../../enums/component.enum';

@Component({
  selector: 'erp-icon-button',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './icon-button.component.html'
})
export class IconButtonComponent {
  @Input() icon: IconName = 'plus';
  @Input() variant: ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' = ButtonVariant.GHOST;
  @Input() size: ButtonSize | 'sm' | 'md' | 'lg' = ButtonSize.MD;
  @Input() shape: 'circle' | 'rounded' | 'square' = 'rounded';
  @Input() tooltip?: string;
  @Input() badge?: number | string;
  @Input() badgeColor: string = 'bg-rose-500 text-white';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() skeleton: boolean = false;
  @Input() ariaLabel?: string;

  @Output() btnClick = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading && !this.skeleton) {
      this.btnClick.emit(event);
    }
  }

  getVariantClasses(): string {
    const v = String(this.variant);
    switch (v) {
      case ButtonVariant.PRIMARY:
      case 'primary':
        return 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-600/20 focus:ring-2 focus:ring-indigo-500/40';
      case ButtonVariant.SECONDARY:
      case 'secondary':
        return 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-slate-400/40';
      case ButtonVariant.OUTLINE:
      case 'outline':
        return 'border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-400/40';
      case ButtonVariant.DANGER:
      case 'danger':
        return 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 focus:ring-2 focus:ring-rose-500/40';
      case ButtonVariant.SUCCESS:
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 focus:ring-2 focus:ring-emerald-500/40';
      case ButtonVariant.GHOST:
      case 'ghost':
      default:
        return 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-slate-400/20';
    }
  }

  getSizeClasses(): string {
    const s = String(this.size);
    switch (s) {
      case ButtonSize.SM:
      case 'sm':
        return 'w-8 h-8';
      case ButtonSize.LG:
      case 'lg':
        return 'w-12 h-12';
      case ButtonSize.MD:
      case 'md':
      default:
        return 'w-10 h-10';
    }
  }

  getIconSize(): number {
    const s = String(this.size);
    switch (s) {
      case ButtonSize.SM:
      case 'sm':
        return 14;
      case ButtonSize.LG:
      case 'lg':
        return 20;
      case ButtonSize.MD:
      case 'md':
      default:
        return 16;
    }
  }

  getShapeClasses(): string {
    switch (this.shape) {
      case 'circle':
        return 'rounded-full';
      case 'square':
        return 'rounded-none';
      case 'rounded':
      default:
        return this.size === 'lg' ? 'rounded-2xl' : 'rounded-xl';
    }
  }
}
