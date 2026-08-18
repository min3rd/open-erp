import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { TabsVariant, TabsOrientation } from '../../../enums/component.enum';

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

@Component({
  selector: 'erp-tabs',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './tabs.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TabsComponent {
  @Input() items: (string | TabItem)[] = [];
  @Input() activeTabId?: string;
  @Input() variant: TabsVariant | 'line' | 'pills' | 'enclosed' | 'segmented' = TabsVariant.LINE;
  @Input() orientation: TabsOrientation | 'horizontal' | 'vertical' = TabsOrientation.HORIZONTAL;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth: boolean = false;

  @Output() tabChange = new EventEmitter<string>();
  @Output() activeTabIdChange = new EventEmitter<string>();

  get normalizedItems(): TabItem[] {
    return this.items.map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `tab-${idx}`, label: item };
      }
      return item;
    });
  }

  get currentActiveId(): string {
    if (this.activeTabId) return this.activeTabId;
    const items = this.normalizedItems;
    return items.length > 0 ? items[0].id : '';
  }

  get isVertical(): boolean {
    return String(this.orientation) === 'vertical';
  }

  get isLineVariant(): boolean {
    return String(this.variant) === 'line';
  }

  get isPillsOrSegmented(): boolean {
    const v = String(this.variant);
    return v === 'pills' || v === 'segmented';
  }

  selectTab(item: TabItem): void {
    if (item.disabled || item.id === this.currentActiveId) return;
    this.activeTabId = item.id;
    this.activeTabIdChange.emit(item.id);
    this.tabChange.emit(item.id);
  }

  getSizeClasses(): string {
    switch (this.size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs gap-1.5';
      case 'lg':
        return 'px-5 py-3 text-sm gap-2.5 font-bold';
      case 'md':
      default:
        return 'px-4 py-2 text-xs font-semibold gap-2';
    }
  }

  getItemClasses(item: TabItem): string {
    const isActive = item.id === this.currentActiveId;
    const v = String(this.variant);
    const o = String(this.orientation);
    const classes: string[] = [this.getSizeClasses()];

    if (this.fullWidth) {
      classes.push('flex-1 justify-center');
    }
    if (item.disabled) {
      classes.push('opacity-40 cursor-not-allowed');
    }

    if (v === 'line') {
      if (o === 'horizontal') {
        classes.push('border-b-2 -mb-px');
      } else {
        classes.push('border-r-2 -mr-px');
      }
      if (isActive) {
        classes.push('border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold');
      } else {
        classes.push('border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
      }
    } else if (v === 'pills' || v === 'segmented') {
      classes.push('rounded-xl');
      if (isActive) {
        classes.push('bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold');
      } else {
        classes.push('text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
      }
    } else if (v === 'enclosed') {
      classes.push('rounded-t-xl');
      if (isActive) {
        classes.push('bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold');
      } else {
        classes.push('text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white');
      }
    }

    return classes.join(' ');
  }
}
