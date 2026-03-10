import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ManagementLayoutService } from '../services/management-layout.service';
import { NavigationService } from '../../../../../core/services/navigation-service';
import { MenuItem } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { NavigationMenu } from '../../../../../core/components/navigation-menu/navigation-menu';

@Component({
  selector: 'management-nav',
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    ButtonModule,
    TooltipModule,
    NavigationMenu,
  ],
  templateUrl: './management-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementNav implements OnInit, OnDestroy {
  private layoutService = inject(ManagementLayoutService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  navMode = this.layoutService.navMode;
  items: MenuItem[] = [];

  ngOnInit(): void {
    // Load module navigation
    this.navigationService
      .getModuleNavigation$('nav-management')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((items) => {
        this.items = items || [];
        this.updateActiveStates();
        this.cdr.markForCheck();
      });

    // Load module navigation data
    this.navigationService
      .loadModuleNavigation('nav-management')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe();

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

  onToggleNavMode(): void {
    this.layoutService.toggleNavMode();
  }

  isActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
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
   * Normalize routerLink to a string path
   */
  private normalizeRouterLink(routerLink: string | any[] | undefined): string {
    if (!routerLink) return '';
    return Array.isArray(routerLink) ? routerLink.join('/') : routerLink;
  }
}
