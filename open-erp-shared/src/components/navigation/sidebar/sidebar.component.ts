import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SidebarMode } from '../../../enums/component.enum';

export interface SidebarSubItem {
  id: string;
  label: string;
  url?: string;
  icon?: IconName;
  active?: boolean;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

export interface SidebarItem {
  id?: string;
  label?: string;
  url?: string;
  icon?: IconName;
  active?: boolean;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  expanded?: boolean;
  children?: SidebarSubItem[];
  sectionHeader?: string;
}

@Component({
  selector: 'erp-sidebar, erp-nav-drawer',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './sidebar.component.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class SidebarComponent {
  @Input() mode: SidebarMode | 'fixed' | 'mini' | 'overlay' = SidebarMode.FIXED;
  @Input() collapsed: boolean = false;
  @Input() openOverlay: boolean = false;
  @Input() brandTitle: string = 'Open ERP';
  @Input() brandSubtitle?: string = 'Enterprise Suite';
  @Input() brandLogo?: string;
  @Input() brandUrl: string = '/';
  @Input() items: SidebarItem[] = [];
  @Input() showCollapseToggle: boolean = true;
  @Input() width: string = '16rem'; // w-64

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() openOverlayChange = new EventEmitter<boolean>();
  @Output() itemClick = new EventEmitter<SidebarItem | SidebarSubItem>();

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  closeDrawer(): void {
    this.openOverlay = false;
    this.openOverlayChange.emit(false);
  }

  toggleItemExpand(item: SidebarItem, event: MouseEvent): void {
    if (this.collapsed) {
      this.collapsed = false;
      this.collapsedChange.emit(false);
    }
    event.stopPropagation();
    item.expanded = !item.expanded;
  }

  onItemClick(item: SidebarItem | SidebarSubItem, event?: MouseEvent): void {
    if (item.disabled) return;
    
    if ('children' in item && item.children && item.children.length > 0) {
      this.toggleItemExpand(item as SidebarItem, event as MouseEvent);
      return;
    }

    this.itemClick.emit(item);
    if (String(this.mode) === 'overlay') {
      this.closeDrawer();
    }
  }

  get isOverlay(): boolean {
    return String(this.mode) === 'overlay';
  }

  get isMini(): boolean {
    return this.collapsed && !this.isOverlay;
  }

  isItemActive(item: SidebarItem): boolean {
    if (item.active) return true;
    if (item.children && item.children.some(child => child.active)) return true;
    return false;
  }
}
