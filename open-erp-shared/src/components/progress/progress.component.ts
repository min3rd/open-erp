import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ProgressVariant, ProgressStatus } from '../../enums/component.enum';

const BAR_STATUS_CLASSES: Record<string, string> = {
  [ProgressStatus.SUCCESS]: 'bg-emerald-500',
  [ProgressStatus.WARNING]: 'bg-amber-500',
  [ProgressStatus.ERROR]: 'bg-rose-500',
  [ProgressStatus.ACTIVE]: 'bg-gradient-to-r from-indigo-500 to-cyan-400',
  [ProgressStatus.NORMAL]: 'bg-indigo-600 dark:bg-indigo-500'
};

const CIRCLE_STATUS_COLORS: Record<string, string> = {
  [ProgressStatus.SUCCESS]: '#10b981',
  [ProgressStatus.WARNING]: '#f59e0b',
  [ProgressStatus.ERROR]: '#f43f5e',
  [ProgressStatus.ACTIVE]: '#6366f1',
  [ProgressStatus.NORMAL]: '#4f46e5'
};

@Component({
  selector: 'erp-progress, erp-progress-bar, erp-progress-circle',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ProgressComponent {
  readonly percent = input<number>(0);
  readonly variant = input<ProgressVariant | 'bar' | 'circle' | 'dashboard'>(ProgressVariant.BAR);
  readonly status = input<ProgressStatus | 'normal' | 'success' | 'warning' | 'error' | 'active'>(ProgressStatus.NORMAL);
  readonly showInfo = input<boolean>(true);
  readonly strokeWidth = input<number>(8);
  readonly circleSize = input<number>(100);
  readonly indeterminate = input<boolean>(false);
  readonly striped = input<boolean>(false);
  readonly color = input<string | undefined>(undefined);
  readonly trackColor = input<string | undefined>(undefined);

  readonly normalizedPercent = computed(() => {
    return Math.max(0, Math.min(100, this.percent()));
  });

  readonly isCircle = computed(() => {
    const v = String(this.variant());
    return v === 'circle' || v === 'dashboard';
  });

  readonly circleRadius = computed(() => {
    return (this.circleSize() - this.strokeWidth()) / 2;
  });

  readonly circleCircumference = computed(() => {
    return 2 * Math.PI * this.circleRadius();
  });

  readonly circleDashOffset = computed(() => {
    const p = this.indeterminate() ? 75 : this.normalizedPercent();
    return this.circleCircumference() - (p / 100) * this.circleCircumference();
  });

  readonly barColorClass = computed(() => {
    if (this.color()) return '';
    const st = String(this.status());
    return BAR_STATUS_CLASSES[st] || BAR_STATUS_CLASSES[ProgressStatus.NORMAL];
  });

  readonly circleStrokeColor = computed(() => {
    const c = this.color();
    if (c) return c;
    const st = String(this.status());
    return CIRCLE_STATUS_COLORS[st] || CIRCLE_STATUS_COLORS[ProgressStatus.NORMAL];
  });
}
