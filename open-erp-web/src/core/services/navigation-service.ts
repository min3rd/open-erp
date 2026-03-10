import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { API_URI_CONFIG } from '../constant';
import { ApiResponse, ApiSingleResponse, isApiResponse, unwrap } from '../api';

/**
 * Navigation Item DTO from backend
 */
export interface NavigationItemDto {
  id: string;
  label: string;
  icon?: string;
  subtitle?: string;
  routerLink?: string | string[];
  url?: string;
  permissions?: {
    include?: string[];
    exclude?: string[];
  };
  command?: string;
  items?: NavigationItemDto[];
  disabled?: boolean;
  target?: string;
  badge?: string | number;
  badgeClass?: string;
  tooltip?: string;
  shortcut?: string;
  class?: string;
  order: number;
  scope: 'global' | 'module';
  moduleId?: string;
  meta?: Record<string, any>;
}

/**
 * Navigation List Response from backend
 */
export interface NavigationListResponse {
  items: NavigationItemDto[];
  scope: 'global' | 'module';
  total: number;
  moduleId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private httpClient = inject(HttpClient);

  private _modules: BehaviorSubject<MenuItem[]> = new BehaviorSubject<MenuItem[]>([]);
  private _moduleNavigation: Map<string, BehaviorSubject<MenuItem[]>> = new Map();

  get modules$(): Observable<MenuItem[]> {
    return this._modules.asObservable();
  }

  /**
   * Get module-specific navigation observable
   */
  getModuleNavigation$(moduleId: string): Observable<MenuItem[]> {
    if (!this._moduleNavigation.has(moduleId)) {
      this._moduleNavigation.set(moduleId, new BehaviorSubject<MenuItem[]>([]));
    }
    return this._moduleNavigation.get(moduleId)!.asObservable();
  }

  /**
   * Load global navigation (modules/root menu)
   */
  loadModules(version: string = 'v1'): Observable<MenuItem[]> {
    // Call backend navigation API for global scope
    return this.httpClient
      .get<ApiSingleResponse<NavigationListResponse>>(
        `${API_URI_CONFIG}/${version}/navigations/global`,
        {
          params: new HttpParams().set('format', 'tree'),
        },
      )
      .pipe(
        map((response) => {
          const navigationData = unwrap(response);
          // The API wraps data in ApiSingleData format with item property containing NavigationListResponse
          const items = navigationData?.item?.items || [];
          const menuItems = this.mapNavigationItemsToMenuItems(items);
          this._modules.next(menuItems);
          return menuItems;
        }),
        catchError((error) => {
          console.error('NavigationService: Error loading global navigation', error);
          // Return empty array on error
          this._modules.next([]);
          return of([]);
        }),
      );
  }

  /**
   * Load module-specific navigation
   */
  loadModuleNavigation(moduleKey: string, version: string = 'v1'): Observable<MenuItem[]> {
    // Call backend navigation API for module scope
    return this.httpClient
      .get<ApiSingleResponse<NavigationListResponse>>(
        `${API_URI_CONFIG}/${version}/navigations/module/${moduleKey}`,
        {
          params: new HttpParams().set('format', 'tree'),
        },
      )
      .pipe(
        map((response) => {
          const navigationData = unwrap(response);
          // The API wraps data in ApiSingleData format with item property containing NavigationListResponse
          const items = navigationData?.item?.items || [];
          const menuItems = this.mapNavigationItemsToMenuItems(items);

          if (!this._moduleNavigation.has(moduleKey)) {
            this._moduleNavigation.set(moduleKey, new BehaviorSubject<MenuItem[]>(menuItems));
          } else {
            this._moduleNavigation.get(moduleKey)!.next(menuItems);
          }

          return menuItems;
        }),
        catchError((error) => {
          console.error(
            `NavigationService: Error loading navigation for module ${moduleKey}`,
            error,
          );
          // Return empty array on error
          const emptyItems: MenuItem[] = [];
          if (!this._moduleNavigation.has(moduleKey)) {
            this._moduleNavigation.set(moduleKey, new BehaviorSubject<MenuItem[]>(emptyItems));
          } else {
            this._moduleNavigation.get(moduleKey)!.next(emptyItems);
          }
          return of(emptyItems);
        }),
      );
  }

  /**
   * Refresh navigation cache (call after create/update/delete operations)
   */
  refreshGlobalNavigation(version: string = 'v1'): Observable<MenuItem[]> {
    return this.loadModules(version);
  }

  /**
   * Refresh module navigation cache
   */
  refreshModuleNavigation(moduleKey: string, version: string = 'v1'): Observable<MenuItem[]> {
    return this.loadModuleNavigation(moduleKey, version);
  }

  /**
   * Map backend NavigationItemDto to PrimeNG MenuItem
   */
  private mapNavigationItemsToMenuItems(items: NavigationItemDto[]): MenuItem[] {
    return items
      .sort((a, b) => a.order - b.order)
      .map((item) => this.mapNavigationItemToMenuItem(item));
  }

  /**
   * Map a single NavigationItemDto to MenuItem
   */
  private mapNavigationItemToMenuItem(item: NavigationItemDto): MenuItem {
    const menuItem: MenuItem = {
      id: item.id,
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
      tooltip: item.tooltip,
      badge: item.badge?.toString(),
      badgeStyleClass: item.badgeClass,
      styleClass: item.class,
      target: item.target,
    };

    // Handle routerLink (can be string or string array)
    if (item.routerLink) {
      menuItem.routerLink = this.normalizeRouterLink(item.routerLink);
    }

    // Handle external URL
    if (item.url) {
      menuItem.url = item.url;
    }

    // Handle command - note: command execution would need to be implemented
    // based on specific application requirements. Currently logs warning only.
    // TODO: Implement command execution strategy if needed
    if (item.command) {
      menuItem.command = () => {
        console.warn(`Command execution not implemented: ${item.command}`);
      };
    }

    // Recursively map child items
    if (item.items && item.items.length > 0) {
      menuItem.items = this.mapNavigationItemsToMenuItems(item.items);
    }

    return menuItem;
  }

  /**
   * Normalize routerLink to always be an array
   */
  private normalizeRouterLink(routerLink: string | string[]): string[] {
    return typeof routerLink === 'string' ? [routerLink] : routerLink;
  }
}
