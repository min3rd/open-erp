import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'erp-link',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, SkeletonComponent],
  templateUrl: './link.component.html'
})
export class LinkComponent {
  @Input() href?: string;
  @Input() routerLink?: string | any[];
  @Input() external: boolean = false;
  @Input() underline: 'always' | 'hover' | 'none' = 'hover';
  @Input() color: 'primary' | 'muted' | 'danger' | 'slate' = 'primary';
  @Input() iconLeft?: IconName;
  @Input() iconRight?: IconName;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  getColorClasses(): string {
    switch (this.color) {
      case 'muted':
        return 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200';
      case 'danger':
        return 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300';
      case 'slate':
        return 'text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400';
      case 'primary':
      default:
        return 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold';
    }
  }

  getUnderlineClasses(): string {
    switch (this.underline) {
      case 'always':
        return 'underline underline-offset-2';
      case 'hover':
        return 'hover:underline underline-offset-2';
      case 'none':
      default:
        return 'no-underline';
    }
  }
}
