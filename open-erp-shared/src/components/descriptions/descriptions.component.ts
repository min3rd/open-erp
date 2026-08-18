import { Component, Input } from '@angular/core';
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

@Component({
  selector: 'erp-descriptions, erp-key-value',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './descriptions.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DescriptionsComponent {
  @Input() title?: string;
  @Input() items: DescriptionItem[] = [];
  @Input() column: number = 3;
  @Input() bordered: boolean = true;
  @Input() layout: DescriptionsLayout | 'horizontal' | 'vertical' = DescriptionsLayout.HORIZONTAL;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  getGridColsClasses(): string {
    switch (this.column) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 3:
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  }

  getSizeClasses(): string {
    switch (this.size) {
      case 'sm': return 'p-2.5 text-xs';
      case 'lg': return 'p-5 text-sm';
      case 'md':
      default: return 'p-3.5 text-xs';
    }
  }
}
