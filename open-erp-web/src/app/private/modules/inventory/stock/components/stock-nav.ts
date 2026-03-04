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
import { StockLayoutService } from '../services/stock-layout.service';
import { NavigationService } from '../../../../../../core/services/navigation-service';
import { MenuItem } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { NavigationMenu } from '../../../../../../core/components/navigation-menu/navigation-menu';

@Component({
  selector: 'stock-nav',
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    ButtonModule,
    TooltipModule,
    NavigationMenu,
  ],
  templateUrl: './stock-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockNav implements OnInit, OnDestroy {
  private layoutService = inject(StockLayoutService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  navMode = this.layoutService.navMode;
  items: MenuItem[] = [];

  ngOnInit(): void {
    this.navigationService.getModuleNavigation$('nav-stock')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((items) => {
        this.items = items || [];
        this.updateActiveStates();
        this.cdr.markForCheck();
      });

    this.navigationService.loadModuleNavigation('nav-stock')
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe();

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

  private updateActiveStates(): void {
    const currentUrl = this.router.url;
    this.items = this.items.map((item) => this.updateItemActiveState(item, currentUrl));
  }

  private updateItemActiveState(item: MenuItem, currentUrl: string): MenuItem {
    const updatedItem = { ...item };

    if (item.routerLink) {
      const routerLink = this.normalizeRouterLink(item.routerLink);

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

    if (item.items && item.items.length > 0) {
      updatedItem.items = item.items.map((child) => this.updateItemActiveState(child, currentUrl));
    }

    return updatedItem;
  }

  private normalizeRouterLink(routerLink: string | any[] | undefined): string {
    if (!routerLink) return '';
    return Array.isArray(routerLink) ? routerLink.join('/') : routerLink;
  }
}
