import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../services/navigation-service';
import { Subject, takeUntil } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { User } from '../../user/user';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '../../../services/layout-service';
import { OrganizationSwitcher } from '../../organization-switcher/organization-switcher';
import { LanguageSwitcher } from '../../language-switcher/language-switcher';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { NavigationMenu } from '../../navigation-menu/navigation-menu';

@Component({
  selector: 'layout-vertical-navigation',
  imports: [
    CommonModule,
    TranslocoModule,
    User,
    ButtonModule,
    OrganizationSwitcher,
    LanguageSwitcher,
    TooltipModule,
    RouterModule,
    RippleModule,
    NavigationMenu,
  ],
  templateUrl: './vertical-navigation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalNavigation implements OnInit, OnDestroy {
  isMobile = input<boolean>(false);

  private layoutService = inject(LayoutService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  items: MenuItem[] = [];
  navMode = this.layoutService.navMode;
  navWidth = this.layoutService.navWidth;

  // For resize functionality
  isResizing = signal(false);

  ngOnInit() {
    // Load navigation items
    this.navigationService.modules$.pipe(takeUntil(this._unsubscribeAll)).subscribe((modules) => {
      this.items = modules || [];
      this.updateActiveStates();
      this.cdr.markForCheck();
    });

    // Update active states on route changes
    this.router.events.pipe(takeUntil(this._unsubscribeAll)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateActiveStates();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  /**
   * Update active states for menu items based on current route
   */
  private updateActiveStates(): void {
    const currentUrl = this.router.url;
    this.items = this.items.map((item) => this.updateItemActiveState(item, currentUrl));
  }

  /**
   * Recursively update active state for menu item and its children
   */
  private updateItemActiveState(item: MenuItem, currentUrl: string): MenuItem {
    const updatedItem = { ...item };

    // Check if this item is active
    if (item.routerLink) {
      const routerLink = this.normalizeRouterLink(item.routerLink);
      
      // Use router.isActive for accurate matching (handles exact and subset paths)
      const isActive = this.router.isActive(routerLink, {
        paths: 'subset',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      });
      
      updatedItem.styleClass = isActive
        ? `${item.styleClass || ''} p-menuitem-link-active`.trim()
        : (item.styleClass || '').replace('p-menuitem-link-active', '').trim();
    }

    // Update children recursively
    if (item.items && item.items.length > 0) {
      updatedItem.items = item.items.map((child) => this.updateItemActiveState(child, currentUrl));
    }

    return updatedItem;
  }

  /**
   * Check if a menu item is active based on router state
   */
  isItemActive(item: MenuItem): boolean {
    if (!item.routerLink) return false;
    
    const routerLink = this.normalizeRouterLink(item.routerLink);
    
    return this.router.isActive(routerLink, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  /**
   * Normalize routerLink to a string path
   */
  private normalizeRouterLink(routerLink: string | any[] | undefined): string {
    if (!routerLink) return '';
    return Array.isArray(routerLink) ? routerLink.join('/') : routerLink;
  }

  logOut(): void {
    console.log("Haven't implement yet");
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  toggleNavMode(): void {
    this.layoutService.toggleNavMode();
  }

  navigateToRegisterOrganization(): void {
    this.router.navigate(['/modules/organization/new']);
    // Close mobile sidebar after navigation
    if (this.isMobile()) {
      this.layoutService.setSidebarVisible(false);
    }
  }

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set(true);

    const startX = event.clientX;
    const startWidth = this.navWidth();

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = startWidth + deltaX;
      this.layoutService.setNavWidth(newWidth);
      this.cdr.markForCheck();
    };

    const onMouseUp = () => {
      this.isResizing.set(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.cdr.markForCheck();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}
