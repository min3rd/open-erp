import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

@Component({
  selector: 'erp-bottom-nav, erp-bottom-navigation',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './bottom-nav.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class BottomNavComponent {
  @Input() items: BottomNavItem[] = [];
  @Input() activeId?: string;
  @Input() fixed: boolean = true;
  @Input() safeArea: boolean = true;
  @Input() floating: boolean = false;
  @Input() showLabels: boolean = true;

  @Output() itemClick = new EventEmitter<BottomNavItem>();
  @Output() activeIdChange = new EventEmitter<string>();

  get currentActiveId(): string {
    if (this.activeId) return this.activeId;
    return this.items.length > 0 ? this.items[0].id : '';
  }

  onItemSelect(item: BottomNavItem): void {
    if (item.disabled) return;
    this.activeId = item.id;
    this.activeIdChange.emit(item.id);
    this.itemClick.emit(item);
  }
}
