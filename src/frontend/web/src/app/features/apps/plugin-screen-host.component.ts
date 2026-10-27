import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import {
  PluginHostScreen,
  PluginHostService,
  PluginIframeLoaderComponent,
  PluginModuleFederationLoaderComponent,
  PluginRenderMode,
  PluginWebComponentLoaderComponent,
  PLUGIN_PERMISSION_CHECKER,
  TranslatePipe,
} from '@shared';

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
    RouterLink,
    TranslatePipe,
    PluginWebComponentLoaderComponent,
    PluginModuleFederationLoaderComponent,
    PluginIframeLoaderComponent,
  ],
  templateUrl: './plugin-screen-host.component.html',
})
export class PluginScreenHostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private hostService = inject(PluginHostService);
  private permissionChecker = inject(PLUGIN_PERMISSION_CHECKER);
  private iframeLoader = viewChild(PluginIframeLoaderComponent);

  pluginKey = signal<string>('');
  screenId = signal<string>('');
  screen = signal<PluginHostScreen | null>(null);
  /** Route handed to the iframe once, before it boots. */
  initialRoute = signal<string>('');
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  forbidden = signal<boolean>(false);

  private lastSyncedUrl = '';

  readonly renderMode = PluginRenderMode;
  readonly frameOffsetPx = 96;

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
        this.iframeLoader()?.navigate(this.iframeRouteFrom(event.urlAfterRedirects));
      });

    this.route.params.subscribe((params) => {
      const key = (params['pluginKey'] ?? '').toString();
      this.pluginKey.set(key);
      this.initialRoute.set(this.iframeRouteFrom(this.router.url));
      void this.resolveScreen(key);
    });
  }

  /** Mirror a plugin-internal route into the core browser URL. */
  onIframeRoute(path: string): void {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const target = `/settings/apps/${this.pluginKey()}${normalized}`;
    if (this.sameUrl(target, this.router.url)) {
      return;
    }
    this.lastSyncedUrl = target;
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }

  private iframeRouteFrom(url: string): string {
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
    const match = screens.find((item) => this.matches(item, key, path))
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
    return path === screen.route || path.startsWith(`${screen.route}/`);
  }

  entryUrl(): string {
    const key = this.pluginKey();
    const screen = this.screen();
    const convention = screen?.render_mode === this.renderMode.WEB_COMPONENT
      ? `/plugins-runtime/${key}/entry.js`
      : `/plugins-runtime/${key}/remote/entry.js`;
    return this.hostService.runtimeEntryUrl(convention);
  }

  iframeEntry(): string {
    return `/api/v1/plugins/runtime/${this.pluginKey()}/`;
  }

  onFailed(): void {
    this.failed.set(true);
  }
}
