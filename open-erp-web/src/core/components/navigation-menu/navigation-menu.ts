import {
  ChangeDetectionStrategy,
  Component,
  input,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * Shared navigation menu component that renders a list of menu items
 * with support for narrow/icon-only mode and active state highlighting
 */
@Component({
  selector: 'app-navigation-menu',
  imports: [CommonModule, RouterModule, TooltipModule, RippleModule, TranslocoModule],
  templateUrl: './navigation-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationMenu {
  /**
   * Menu items to display
   */
  items = input.required<MenuItem[]>();

  /**
   * Navigation mode: 'narrow' for icon-only, 'sidebar' for full width
   */
  navMode = input<Signal<'narrow' | 'sidebar'> | 'narrow' | 'sidebar'>('sidebar');

  /**
   * Whether the menu is on mobile device
   */
  isMobile = input<boolean>(false);

  /**
   * ID prefix for menu items (e.g., 'management-nav', 'organization-nav')
   */
  idPrefix = input.required<string>();

  /**
   * Empty state message translation key
   */
  emptyMessage = input<string>('navigation.noItems');

  /**
   * Whether to enable ripple effect
   */
  enableRipple = input<boolean>(false);

  /**
   * Get the current nav mode value
   * Handles both Signal and direct values
   */
  getNavMode(): 'narrow' | 'sidebar' {
    const mode = this.navMode();
    if (typeof mode === 'function') {
      return mode();
    }
    return mode;
  }

  /**
   * Check if an item is in narrow mode
   */
  isNarrowMode(): boolean {
    return this.getNavMode() === 'narrow' && !this.isMobile();
  }

  /**
   * Check if item should show label
   */
  shouldShowLabel(): boolean {
    return this.getNavMode() === 'sidebar' || this.isMobile();
  }
}
