import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { KpiTrendDirection } from '../../enums/component.enum';

const TREND_CLASSES: Record<string, string> = {
  [KpiTrendDirection.UP]: 'text-emerald-600 dark:text-emerald-400',
  [KpiTrendDirection.DOWN]: 'text-rose-600 dark:text-rose-400',
  [KpiTrendDirection.NEUTRAL]: 'text-slate-500 dark:text-slate-400'
};

const TREND_ICONS: Record<string, IconName> = {
  [KpiTrendDirection.UP]: 'trending-up',
  [KpiTrendDirection.DOWN]: 'trending-down',
  [KpiTrendDirection.NEUTRAL]: 'activity'
};

@Component({
  selector: 'erp-kpi-card',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './kpi-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardComponent {
  readonly title = input<string>('');
  readonly value = input<string | number>('');
  readonly subText = input<string>('');
  readonly trend = input<KpiTrendDirection | 'up' | 'down' | 'neutral'>(KpiTrendDirection.NEUTRAL);
  readonly iconName = input<IconName | undefined>(undefined);
  readonly iconBg = input<string>('bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400');
  readonly loading = input<boolean>(false);

  readonly trendClass = computed(() => {
    const tr = String(this.trend());
    return TREND_CLASSES[tr] || TREND_CLASSES[KpiTrendDirection.NEUTRAL];
  });

  readonly trendIcon = computed(() => {
    const tr = String(this.trend());
    return TREND_ICONS[tr] || 'activity';
  });
}
