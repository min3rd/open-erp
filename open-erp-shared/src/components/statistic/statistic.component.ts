import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { KpiTrendDirection } from '../../enums/component.enum';

@Component({
  selector: 'erp-statistic, erp-statistic-card',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './statistic.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class StatisticComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() subText?: string;
  @Input() icon?: IconName;
  @Input() iconColor?: string = 'text-indigo-600 dark:text-indigo-400';
  @Input() iconBg?: string = 'bg-indigo-50 dark:bg-indigo-950/60';
  @Input() trend?: KpiTrendDirection | 'up' | 'down' | 'neutral';
  @Input() trendValue?: string;
  @Input() trendLabel?: string;
  @Input() loading: boolean = false;
  @Input() bordered: boolean = true;

  get isTrendUp(): boolean {
    return String(this.trend) === 'up';
  }

  get isTrendDown(): boolean {
    return String(this.trend) === 'down';
  }
}
