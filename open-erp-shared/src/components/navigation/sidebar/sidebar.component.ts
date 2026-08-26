import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class SidebarComponent {
  readonly mode = input<SidebarMode | 'fixed' | 'mini' | 'overlay'>(SidebarMode.FIXED);
  readonly collapsed = model<boolean>(false);
  readonly openOverlay = model<boolean>(false);
  readonly brandTitle = input<string>('Open ERP');
  readonly brandSubtitle = input<string | undefined>('Enterprise Suite');
  readonly brandLogo = input<string | undefined>(undefined);
  readonly brandUrl = input<string>('/');
  readonly items = input<SidebarItem[]>([]);
  readonly showCollapseToggle = input<boolean>(true);
  readonly width = input<string>('16rem');

  readonly itemClick = output<SidebarItem | SidebarSubItem>();

  readonly isOverlay = computed(() => String(this.mode()) === 'overlay');

  readonly isMini = computed(() => this.collapsed() && !this.isOverlay());

  toggleCollapse(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
  }

  closeDrawer(): void {
    this.openOverlay.set(false);
  }

  toggleItemExpand(item: SidebarItem, event: MouseEvent): void {
    if (this.collapsed()) {
      this.collapsed.set(false);
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
    if (String(this.mode()) === 'overlay') {
      this.closeDrawer();
    }
  }

  isItemActive(item: SidebarItem): boolean {
    if (item.active) return true;
    if (item.children && item.children.some(child => child.active)) return true;
    return false;
  }
}
