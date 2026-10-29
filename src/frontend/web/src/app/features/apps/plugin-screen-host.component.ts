import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import {
  PluginHostScreen,
  PluginHostService,
  PluginModuleFederationLoaderComponent,
  PluginRenderMode,
  PluginWebComponentLoaderComponent,
  PLUGIN_PERMISSION_CHECKER,
  TranslatePipe,
} from '@shared';
import { AuthService } from '../../core/services/auth.service';
import { PluginContextService } from '../../core/services/plugin-context.service';

/**
 * Fixed host for plugin screens. The screen itself (route, title, permission,
 * render mode) comes from `/api/v1/plugins/ui-manifest`; the core never imports
 * plugin UI source and never hardcodes a plugin route.
 */
@Component({
  selector: 'app-plugin-screen-host',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    PluginWebComponentLoaderComponent,
    PluginModuleFederationLoaderComponent,
  ],
  templateUrl: './plugin-screen-host.component.html',
})
export class PluginScreenHostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private hostService = inject(PluginHostService);
  private auth = inject(AuthService);
  private permissionChecker = inject(PLUGIN_PERMISSION_CHECKER);
  readonly pluginContext = inject(PluginContextService);

  pluginKey = signal<string>('');
  screenId = signal<string>('');
  screen = signal<PluginHostScreen | null>(null);
  /** Plugin-internal route kept in sync with the Core browser URL. */
  initialRoute = signal<string>('');
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  forbidden = signal<boolean>(false);

  private lastSyncedUrl = '';

  readonly renderMode = PluginRenderMode;

  ngOnInit(): void {
    this.lastSyncedUrl = this.router.url;
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (this.sameUrl(event.urlAfterRedirects, this.lastSyncedUrl)) {
          return;
        }
        this.lastSyncedUrl = event.urlAfterRedirects;
        this.initialRoute.set(this.routeFromUrl(event.urlAfterRedirects));
      });

    this.route.params.subscribe((params) => {
      const key = (params['pluginKey'] ?? '').toString();
      this.pluginKey.set(key);
      this.initialRoute.set(this.routeFromUrl(this.router.url));
      void this.resolveScreen(key);
    });
  }

  /** Mirror a plugin-internal route into the core browser URL. */
  onRouteChange(path: string): void {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    // A plugin that boots from a bookmark may emit the path without the query
    // it was mounted with; keep the Core query in that case.
    const currentQuery = this.router.url.includes('?') ? this.router.url.slice(this.router.url.indexOf('?')) : '';
    const query = normalized.includes('?') || !currentQuery ? '' : currentQuery;
    const target = `/settings/apps/${this.pluginKey()}${normalized}${query}`;
    if (this.sameUrl(target, this.router.url)) {
      return;
    }
    this.lastSyncedUrl = target;
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }

  private routeFromUrl(url: string): string {
    const base = `/settings/apps/${this.pluginKey()}`;
    const [path, query] = url.split('?');
    const subPath = path.startsWith(base) ? path.slice(base.length) : '';
    return `${subPath}${query ? `?${query}` : ''}`;
  }

  private sameUrl(left: string, right: string): boolean {
    return left === right;
  }

  private async resolveScreen(key: string): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    this.forbidden.set(false);

    const manifest = await this.hostService.loadManifest(true);
    const screens = manifest?.screens ?? [];
    const path = this.currentPath();
    const candidates = screens.filter((item) => this.matches(item, key, path));
    const exact = candidates.find((item) => this.coreRoute(item) === path);
    const match = exact
      ?? candidates.sort((left, right) => (right.route?.length ?? 0) - (left.route?.length ?? 0))[0]
      ?? screens.find((item) => item.plugin_key === key)
      ?? null;

    if (!match) {
      this.failed.set(true);
      this.loading.set(false);
      return;
    }
    if (!this.permissionChecker(match.permission)) {
      this.forbidden.set(true);
      this.loading.set(false);
      return;
    }
    this.screenId.set(match.route);
    this.screen.set(match);
    this.loading.set(false);
  }

  private currentPath(): string {
    return this.router.url.split('?')[0];
  }

  private matches(screen: PluginHostScreen, key: string, path: string): boolean {
    if (screen.plugin_key !== key || !screen.route) {
      return false;
    }
    // Plugin manifests use app-relative routes (`/apps/<key>/...`), while the
    // Core host mounts them under `/settings`. Accept both so multi-screen
    // plugins can resolve the screen that matches the current sub-route.
    const coreRoute = this.coreRoute(screen);
    return path === coreRoute || path.startsWith(`${coreRoute}/`);
  }

  private coreRoute(screen: PluginHostScreen): string {
    const route = screen.route ?? '';
    return route.startsWith('/apps/') ? `/settings${route}` : route;
  }

  entryUrl(): string {
    const key = this.pluginKey();
    const screen = this.screen();
    const defined = screen?.entry
      || (screen?.render_mode === this.renderMode.WEB_COMPONENT
        ? `/plugins-runtime/${key}/main.js`
        : `/plugins-runtime/${key}/remoteEntry.js`);
    return this.hostService.runtimeEntryUrl(defined);
  }

  onFailed(code?: string): void {
    // The plugin runtime rejected the Core session; ending it returns the user
    // to login instead of leaving a dead screen mounted.
    if (code === 'PLUGIN_RUNTIME_TOKEN_INVALID') {
      this.auth.clearSession();
      return;
    }
    this.failed.set(true);
  }
}
