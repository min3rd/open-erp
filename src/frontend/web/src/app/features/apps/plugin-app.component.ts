import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PluginHostScreen,
  PluginHostService,
  PluginIframeLoaderComponent,
  PluginModuleFederationLoaderComponent,
  PluginRenderMode,
  PluginWebComponentLoaderComponent,
  SharpButtonComponent,
  TranslatePipe,
  PLUGIN_PERMISSION_CHECKER,
} from '@shared';

@Component({
  selector: 'app-plugin-app',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    SharpButtonComponent,
    PluginWebComponentLoaderComponent,
    PluginModuleFederationLoaderComponent,
    PluginIframeLoaderComponent,
  ],
  templateUrl: './plugin-app.component.html',
})
export class PluginAppComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hostService = inject(PluginHostService);
  private permissionChecker = inject(PLUGIN_PERMISSION_CHECKER);

  pluginKey = signal<string>('');
  subPath = signal<string>('');
  screen = signal<PluginHostScreen | null>(null);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  forbidden = signal<boolean>(false);

  readonly renderMode = PluginRenderMode;

  private mounted = false;

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.params;
    const parentParams = this.route.parent?.snapshot.params ?? {};
    const key = (params['pluginKey'] ?? parentParams['pluginKey'] ?? '').toString();
    this.pluginKey.set(key);
    const url = this.router.url;
    const marker = `/apps/${key}`;
    const rest = url.startsWith(marker) ? url.substring(marker.length) : '';
    this.subPath.set(rest.replace(/^\//, ''));

    const manifest = await this.hostService.loadManifest();
    const screens = manifest?.screens ?? [];
    const match = screens.find((item) => item.plugin_key === key) ?? null;
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
    this.screen.set(match);
    this.loading.set(false);
    this.mounted = true;
  }

  ngOnDestroy(): void {
    this.mounted = false;
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

  backToMarketplace(): void {
    void this.router.navigate(['/settings/plugins']);
  }
}
