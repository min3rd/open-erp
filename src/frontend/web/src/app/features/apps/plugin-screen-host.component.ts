import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private hostService = inject(PluginHostService);
  private permissionChecker = inject(PLUGIN_PERMISSION_CHECKER);

  pluginKey = signal<string>('');
  screenId = signal<string>('');
  screen = signal<PluginHostScreen | null>(null);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  forbidden = signal<boolean>(false);

  readonly renderMode = PluginRenderMode;
  readonly frameOffsetPx = 40;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const key = (params['pluginKey'] ?? '').toString();
      this.pluginKey.set(key);
      void this.resolveScreen(key);
    });
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
