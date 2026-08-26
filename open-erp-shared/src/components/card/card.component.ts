import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { CardVariant } from '../../enums/component.enum';

const VARIANT_CLASSES: Record<string, string> = {
  [CardVariant.OUTLINED]: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
  [CardVariant.FILLED]: 'bg-slate-50 dark:bg-slate-850/80 border border-slate-200/60 dark:border-slate-700/60',
  [CardVariant.GHOST]: 'bg-transparent',
  [CardVariant.ELEVATED]: 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-900/5'
};

@Component({
  selector: 'erp-card',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CardComponent {
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly coverImage = input<string | undefined>(undefined);
  readonly variant = input<CardVariant | 'elevated' | 'outlined' | 'filled' | 'ghost'>(CardVariant.ELEVATED);
  readonly hoverable = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly padded = input<boolean>(true);

  readonly variantClass = computed(() => {
    const v = String(this.variant());
    return VARIANT_CLASSES[v] || VARIANT_CLASSES[CardVariant.ELEVATED];
  });
}
