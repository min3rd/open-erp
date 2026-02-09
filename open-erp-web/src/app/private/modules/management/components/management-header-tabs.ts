import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { NavigationService } from '../../../../../core/services/navigation-service';
import { MenuItem } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'management-header-tabs',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoModule],
  templateUrl: './management-header-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementHeaderTabs implements OnInit, OnDestroy {
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  items: MenuItem[] = [];

  ngOnInit(): void {
    // Load module navigation
    this.navigationService.getModuleNavigation$('nav-management')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((items) => {
        this.items = items || [];
        this.cdr.markForCheck();
      });

    // Load module navigation data
    this.navigationService.loadModuleNavigation('nav-management')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe();

    // Update active states on route changes
    this.router.events.pipe(takeUntil(this._unsubscribeAll)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
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
   * Normalize routerLink to a string path
   */
  private normalizeRouterLink(routerLink: string | any[] | undefined): string {
    if (!routerLink) return '';
    return Array.isArray(routerLink) ? routerLink.join('/') : routerLink;
  }
}
