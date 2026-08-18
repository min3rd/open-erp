import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { CardVariant } from '../../enums/component.enum';

@Component({
  selector: 'erp-card',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './card.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: IconName;
  @Input() coverImage?: string;
  @Input() variant: CardVariant | 'elevated' | 'outlined' | 'filled' | 'ghost' = CardVariant.ELEVATED;
  @Input() hoverable: boolean = false;
  @Input() loading: boolean = false;
  @Input() padded: boolean = true;

  getVariantClasses(): string {
    const v = String(this.variant);
    switch (v) {
      case 'outlined':
        return 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
      case 'filled':
        return 'bg-slate-50 dark:bg-slate-850/80 border border-slate-200/60 dark:border-slate-700/60';
      case 'ghost':
        return 'bg-transparent';
      case 'elevated':
      default:
        return 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-900/5';
    }
  }
}
