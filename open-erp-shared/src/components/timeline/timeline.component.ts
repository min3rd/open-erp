import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { TimelinePosition } from '../../enums/component.enum';

export interface TimelineItem {
  id?: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: IconName;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  tag?: string;
  active?: boolean;
}

const DOT_CLASSES: Record<string, string> = {
  success: 'bg-emerald-500 text-white ring-4 ring-emerald-500/20',
  warning: 'bg-amber-500 text-white ring-4 ring-amber-500/20',
  danger: 'bg-rose-500 text-white ring-4 ring-rose-500/20',
  neutral: 'bg-slate-400 text-white ring-4 ring-slate-400/20',
  primary: 'bg-indigo-600 text-white ring-4 ring-indigo-600/20'
};

@Component({
  selector: 'erp-timeline',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './timeline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TimelineComponent {
  readonly items = input<TimelineItem[]>([]);
  readonly position = input<TimelinePosition | 'left' | 'right' | 'alternate'>(TimelinePosition.LEFT);
  readonly reverse = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly normalizedItems = computed<TimelineItem[]>(() => {
    const raw = this.items();
    return this.reverse() ? [...raw].reverse() : raw;
  });

  getDotClasses(item: TimelineItem): string {
    const c = item.color || 'primary';
    return DOT_CLASSES[c] || DOT_CLASSES['primary'];
  }
}
