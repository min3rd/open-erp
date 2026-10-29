import { AfterViewInit, Component, ElementRef, Input, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ContextMenuComponent } from '@shared';
import { CatalogRuntimeService } from './core/catalog-runtime.service';
import { CatalogScope } from './core/services/catalog-admin.service';

/**
 * Catalog web component shell. The core host sets `route`, `scope`, `readonly`
 * as properties and listens to `op:route-change`/`op:resize` events; the plugin
 * never uses postMessage or reads the host URL.
 */
@Component({
  selector: 'app-catalog-plugin-shell',
  standalone: true,
  imports: [RouterOutlet, ContextMenuComponent],
  templateUrl: './catalog-plugin-shell.component.html',
})
export class CatalogPluginShellComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private runtime = inject(CatalogRuntimeService);

  private readonly resizeHandler = () => this.emitResize();

  @Input()
  set route(value: string) {
    const path = value?.startsWith('/') ? value : `/${value ?? ''}`;
    const query = path.includes('?') ? new URLSearchParams(path.slice(path.indexOf('?') + 1)) : null;
    this.runtime.viewMode.set(query?.get('view') ?? '');
    if (path && path !== '/' && this.router.url !== path) {
      void this.router.navigateByUrl(path);
    }
  }

  @Input()
  set scope(value: string) {
    this.runtime.scope.set(value === 'system' ? CatalogScope.SYSTEM : CatalogScope.TENANT);
  }

  @Input()
  set readonly(value: boolean | string) {
    const readOnly = value === true || value === 'true' || value === '1';
    this.runtime.readOnly.set(readOnly);
    this.host.nativeElement.classList.toggle('catalog-readonly', readOnly);
  }

  @Input()
  set apiBaseUrl(value: string) {
    this.runtime.apiBaseUrl.set((value ?? '').replace(/\/$/, ''));
  }

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.emitRoute(event.urlAfterRedirects));
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeHandler);
    if (this.router.url === '/' || this.router.url === '') {
      void this.router.navigateByUrl('/all/-/20/1/-/list');
    }
    setTimeout(() => {
      this.emitResize();
      this.emitRoute(this.router.url);
    }, 0);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  private emitRoute(path: string): void {
    this.host.nativeElement.dispatchEvent(new CustomEvent('op:route-change', {
      bubbles: true,
      composed: true,
      detail: { path },
    }));
  }

  private emitResize(): void {
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    this.host.nativeElement.dispatchEvent(new CustomEvent('op:resize', {
      bubbles: true,
      composed: true,
      detail: { height },
    }));
  }
}
