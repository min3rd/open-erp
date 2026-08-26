import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { KpiTrendDirection } from '../../enums/component.enum';

@Component({
  selector: 'erp-statistic, erp-statistic-card',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './statistic.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class StatisticComponent {
  readonly title = input<string>('');
  readonly value = input<string | number>('');
  readonly prefix = input<string | undefined>(undefined);
  readonly suffix = input<string | undefined>(undefined);
  readonly subText = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly iconColor = input<string>('text-indigo-600 dark:text-indigo-400');
  readonly iconBg = input<string>('bg-indigo-50 dark:bg-indigo-950/60');
  readonly trend = input<KpiTrendDirection | 'up' | 'down' | 'neutral' | undefined>(undefined);
  readonly trendValue = input<string | undefined>(undefined);
  readonly trendLabel = input<string | undefined>(undefined);
  readonly loading = input<boolean>(false);
  readonly bordered = input<boolean>(true);

  readonly isTrendUp = computed(() => String(this.trend()) === 'up');
  readonly isTrendDown = computed(() => String(this.trend()) === 'down');
}
