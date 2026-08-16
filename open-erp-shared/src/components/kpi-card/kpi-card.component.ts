import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { KpiTrendDirection } from '../../enums/component.enum';

@Component({
  selector: 'erp-kpi-card',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './kpi-card.component.html'
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() subText: string = '';
  @Input() trend: KpiTrendDirection | 'up' | 'down' | 'neutral' = KpiTrendDirection.NEUTRAL;
  @Input() iconName?: IconName;
  @Input() iconBg: string = 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400';
  @Input() loading: boolean = false;

  getTrendClasses(): string {
    const tr = String(this.trend);
    switch (tr) {
      case KpiTrendDirection.UP:
      case 'up':
        return 'text-emerald-600 dark:text-emerald-400';
      case KpiTrendDirection.DOWN:
      case 'down':
        return 'text-rose-600 dark:text-rose-400';
      case KpiTrendDirection.NEUTRAL:
      case 'neutral':
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  }

  getTrendIcon(): IconName {
    const tr = String(this.trend);
    if (tr === KpiTrendDirection.UP || tr === 'up') return 'trending-up';
    if (tr === KpiTrendDirection.DOWN || tr === 'down') return 'trending-down';
    return 'activity';
  }
}
