import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ButtonVariant, ButtonSize } from '../../enums/component.enum';

@Component({
  selector: 'erp-button',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './button.component.html'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' = ButtonVariant.PRIMARY;
  @Input() size: ButtonSize | 'sm' | 'md' | 'lg' = ButtonSize.MD;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() skeleton: boolean = false;
  @Input() iconLeft?: IconName;
  @Input() iconRight?: IconName;
  @Input() fullWidth: boolean = false;

  @Output() btnClick = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading && !this.skeleton) {
      this.btnClick.emit(event);
    }
  }

  getVariantClasses(): string {
    const v = String(this.variant);
    switch (v) {
      case ButtonVariant.SECONDARY:
      case 'secondary':
        return 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700';
      case ButtonVariant.OUTLINE:
      case 'outline':
        return 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700';
      case ButtonVariant.DANGER:
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20';
      case ButtonVariant.GHOST:
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300';
      case ButtonVariant.SUCCESS:
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20';
      case ButtonVariant.PRIMARY:
      case 'primary':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20';
    }
  }

  getSizeClasses(): string {
    const s = String(this.size);
    switch (s) {
      case ButtonSize.SM:
      case 'sm':
        return 'px-3 py-1.5 text-xs rounded-xl gap-1.5';
      case ButtonSize.LG:
      case 'lg':
        return 'px-6 py-3 text-sm rounded-2xl gap-2.5 font-bold';
      case ButtonSize.MD:
      case 'md':
      default:
        return 'px-4 py-2.5 text-xs rounded-xl gap-2 font-semibold';
    }
  }

  getSkeletonHeight(): string {
    const s = String(this.size);
    switch (s) {
      case ButtonSize.SM:
      case 'sm':
        return '2rem';
      case ButtonSize.LG:
      case 'lg':
        return '2.75rem';
      case ButtonSize.MD:
      case 'md':
      default:
        return '2.375rem';
    }
  }
}
