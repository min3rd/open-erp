import { Component, Input } from '@angular/core';
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

@Component({
  selector: 'erp-timeline',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './timeline.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TimelineComponent {
  @Input() items: TimelineItem[] = [];
  @Input() position: TimelinePosition | 'left' | 'right' | 'alternate' = TimelinePosition.LEFT;
  @Input() reverse: boolean = false;
  @Input() loading: boolean = false;

  get normalizedItems(): TimelineItem[] {
    return this.reverse ? [...this.items].reverse() : this.items;
  }

  getDotClasses(item: TimelineItem): string {
    const c = item.color || 'primary';
    switch (c) {
      case 'success':
        return 'bg-emerald-500 text-white ring-4 ring-emerald-500/20';
      case 'warning':
        return 'bg-amber-500 text-white ring-4 ring-amber-500/20';
      case 'danger':
        return 'bg-rose-500 text-white ring-4 ring-rose-500/20';
      case 'neutral':
        return 'bg-slate-400 text-white ring-4 ring-slate-400/20';
      case 'primary':
      default:
        return 'bg-indigo-600 text-white ring-4 ring-indigo-600/20';
    }
  }
}
