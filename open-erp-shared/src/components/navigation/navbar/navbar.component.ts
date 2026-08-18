import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { NavbarPosition } from '../../../enums/component.enum';

export interface NavbarItem {
  id?: string;
  label: string;
  url?: string;
  icon?: IconName;
  active?: boolean;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  children?: NavbarItem[];
}

@Component({
  selector: 'erp-navbar, erp-header, erp-app-bar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './navbar.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class NavbarComponent {
  @Input() brandTitle: string = '';
  @Input() brandSubtitle?: string;
  @Input() brandLogo?: string;
  @Input() brandUrl: string = '/';
  @Input() position: NavbarPosition | 'static' | 'sticky' | 'fixed' = NavbarPosition.STICKY;
  @Input() bordered: boolean = true;
  @Input() glass: boolean = true;
  @Input() items: NavbarItem[] = [];
  @Input() showMobileToggle: boolean = true;
  @Input() mobileOpen: boolean = false;

  @Output() mobileToggle = new EventEmitter<boolean>();
  @Output() itemClick = new EventEmitter<NavbarItem>();

  onToggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
    this.mobileToggle.emit(this.mobileOpen);
  }

  onItemClick(item: NavbarItem, event?: MouseEvent): void {
    if (item.disabled) return;
    this.itemClick.emit(item);
    if (this.mobileOpen) {
      this.mobileOpen = false;
      this.mobileToggle.emit(false);
    }
  }

  getPositionClasses(): string {
    switch (this.position) {
      case NavbarPosition.FIXED:
      case 'fixed':
        return 'fixed top-0 left-0 right-0 z-40';
      case NavbarPosition.STICKY:
      case 'sticky':
        return 'sticky top-0 z-30';
      case NavbarPosition.STATIC:
      case 'static':
      default:
        return 'relative z-20';
    }
  }
}
