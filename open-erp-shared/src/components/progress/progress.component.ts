import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ProgressVariant, ProgressStatus } from '../../enums/component.enum';

@Component({
  selector: 'erp-progress, erp-progress-bar, erp-progress-circle',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './progress.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ProgressComponent {
  @Input() percent: number = 0;
  @Input() variant: ProgressVariant | 'bar' | 'circle' | 'dashboard' = ProgressVariant.BAR;
  @Input() status: ProgressStatus | 'normal' | 'success' | 'warning' | 'error' | 'active' = ProgressStatus.NORMAL;
  @Input() showInfo: boolean = true;
  @Input() strokeWidth: number = 8;
  @Input() circleSize: number = 100;
  @Input() indeterminate: boolean = false;
  @Input() striped: boolean = false;
  @Input() color?: string;
  @Input() trackColor?: string;

  get normalizedPercent(): number {
    return Math.max(0, Math.min(100, this.percent));
  }

  get isCircle(): boolean {
    return this.variant === 'circle' || this.variant === 'dashboard';
  }

  get circleRadius(): number {
    return (this.circleSize - this.strokeWidth) / 2;
  }

  get circleCircumference(): number {
    return 2 * Math.PI * this.circleRadius;
  }

  get circleDashOffset(): number {
    const p = this.indeterminate ? 75 : this.normalizedPercent;
    return this.circleCircumference - (p / 100) * this.circleCircumference;
  }

  get barColorClass(): string {
    if (this.color) return '';
    switch (this.status) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-rose-500';
      case 'active':
        return 'bg-gradient-to-r from-indigo-500 to-cyan-400';
      case 'normal':
      default:
        return 'bg-indigo-600 dark:bg-indigo-500';
    }
  }

  get circleStrokeColor(): string {
    if (this.color) return this.color;
    switch (this.status) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#f43f5e';
      case 'active':
        return '#6366f1';
      case 'normal':
      default:
        return '#4f46e5';
    }
  }
}
