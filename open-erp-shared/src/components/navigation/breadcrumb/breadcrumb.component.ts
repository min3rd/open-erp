import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { BreadcrumbSeparator } from '../../../enums/component.enum';

export interface BreadcrumbItem {
  id?: string;
  label: string;
  url?: string;
  icon?: IconName;
  active?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'erp-breadcrumb',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './breadcrumb.component.html',
  styles: [`
    :host {
      display: inline-block;
      max-width: 100%;
    }
  `]
})
export class BreadcrumbComponent {
  @Input() items: (string | BreadcrumbItem)[] = [];
  @Input() separator: BreadcrumbSeparator | 'slash' | 'chevron' | 'arrow' | 'dot' | string = BreadcrumbSeparator.CHEVRON;
  @Input() maxItems?: number;
  @Input() showHomeIcon: boolean = false;
  @Input() homeIcon: IconName = 'home';
  @Input() homeUrl: string = '/';
  @Input() loading: boolean = false;

  @Output() itemClick = new EventEmitter<BreadcrumbItem>();

  isExpandedCollapsed: boolean = false;

  get normalizedItems(): BreadcrumbItem[] {
    const list: BreadcrumbItem[] = this.items.map((item, idx) => {
      if (typeof item === 'string') {
        return { label: item, active: idx === this.items.length - 1 };
      }
      return {
        ...item,
        active: item.active !== undefined ? item.active : idx === this.items.length - 1
      };
    });

    return list;
  }

  get displayItems(): { item: BreadcrumbItem; isEllipsis?: boolean; originalIndex: number }[] {
    const all = this.normalizedItems;
    if (!this.maxItems || all.length <= this.maxItems || this.isExpandedCollapsed) {
      return all.map((item, idx) => ({ item, originalIndex: idx }));
    }

    const first = all.slice(0, 1);
    const last = all.slice(-(this.maxItems - 1));
    return [
      { item: first[0], originalIndex: 0 },
      { item: { label: '...' }, isEllipsis: true, originalIndex: -1 },
      ...last.map((item, i) => ({ item, originalIndex: all.length - last.length + i }))
    ];
  }

  onItemClick(item: BreadcrumbItem, event: MouseEvent): void {
    if (item.disabled || item.active) {
      event.preventDefault();
      return;
    }
    this.itemClick.emit(item);
  }

  expandEllipsis(): void {
    this.isExpandedCollapsed = true;
  }
}
