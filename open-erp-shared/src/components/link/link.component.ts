import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

const COLOR_CLASSES: Record<string, string> = {
  muted: 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
  danger: 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300',
  slate: 'text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400',
  primary: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold'
};

const UNDERLINE_CLASSES: Record<string, string> = {
  always: 'underline underline-offset-2',
  hover: 'hover:underline underline-offset-2',
  none: 'no-underline'
};

@Component({
  selector: 'erp-link',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, SkeletonComponent],
  templateUrl: './link.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkComponent {
  readonly href = input<string | undefined>(undefined);
  readonly routerLink = input<string | any[] | undefined>(undefined);
  readonly external = input<boolean>(false);
  readonly underline = input<'always' | 'hover' | 'none'>('hover');
  readonly color = input<'primary' | 'muted' | 'danger' | 'slate'>('primary');
  readonly iconLeft = input<IconName | undefined>(undefined);
  readonly iconRight = input<IconName | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly colorClass = computed(() => {
    return COLOR_CLASSES[this.color()] || COLOR_CLASSES['primary'];
  });

  readonly underlineClass = computed(() => {
    return UNDERLINE_CLASSES[this.underline()] || UNDERLINE_CLASSES['hover'];
  });
}
