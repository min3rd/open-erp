import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: inline-block;
      max-width: 100%;
    }
  `]
})
export class BreadcrumbComponent {
  readonly items = input<(string | BreadcrumbItem)[]>([]);
  readonly separator = input<BreadcrumbSeparator | 'slash' | 'chevron' | 'arrow' | 'dot' | string>(BreadcrumbSeparator.CHEVRON);
  readonly maxItems = input<number | undefined>(undefined);
  readonly showHomeIcon = input<boolean>(false);
  readonly homeIcon = input<IconName>('home');
  readonly homeUrl = input<string>('/');
  readonly loading = input<boolean>(false);

  readonly itemClick = output<BreadcrumbItem>();

  isExpandedCollapsed = signal<boolean>(false);

  readonly normalizedItems = computed<BreadcrumbItem[]>(() => {
    const raw = this.items();
    return raw.map((item, idx) => {
      if (typeof item === 'string') {
        return { label: item, active: idx === raw.length - 1 };
      }
      return {
        ...item,
        active: item.active !== undefined ? item.active : idx === raw.length - 1
      };
    });
  });

  readonly displayItems = computed<{ item: BreadcrumbItem; isEllipsis?: boolean; originalIndex: number }[]>(() => {
    const all = this.normalizedItems();
    const max = this.maxItems();
    if (!max || all.length <= max || this.isExpandedCollapsed()) {
      return all.map((item, idx) => ({ item, originalIndex: idx }));
    }

    const first = all.slice(0, 1);
    const last = all.slice(-(max - 1));
    return [
      { item: first[0], originalIndex: 0 },
      { item: { label: '...' }, isEllipsis: true, originalIndex: -1 },
      ...last.map((item, i) => ({ item, originalIndex: all.length - last.length + i }))
    ];
  });

  onItemClick(item: BreadcrumbItem, event: MouseEvent): void {
    if (item.disabled || item.active) {
      event.preventDefault();
      return;
    }
    this.itemClick.emit(item);
  }

  expandEllipsis(): void {
    this.isExpandedCollapsed.set(true);
  }
}
