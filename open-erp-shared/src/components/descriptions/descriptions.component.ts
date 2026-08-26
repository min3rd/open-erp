import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { DescriptionsLayout } from '../../enums/component.enum';

export interface DescriptionItem {
  label: string;
  value?: any;
  span?: number;
  icon?: IconName;
  badge?: string;
  badgeColor?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'p-2.5 text-xs',
  lg: 'p-5 text-sm',
  md: 'p-3.5 text-xs'
};

@Component({
  selector: 'erp-descriptions, erp-key-value',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './descriptions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DescriptionsComponent {
  readonly title = input<string | undefined>(undefined);
  readonly items = input<DescriptionItem[]>([]);
  readonly column = input<number>(3);
  readonly bordered = input<boolean>(true);
  readonly layout = input<DescriptionsLayout | 'horizontal' | 'vertical'>(DescriptionsLayout.HORIZONTAL);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly gridColsClass = computed(() => {
    switch (this.column()) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 3:
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  });

  readonly sizeClass = computed(() => {
    return SIZE_CLASSES[this.size()] || SIZE_CLASSES['md'];
  });
}
