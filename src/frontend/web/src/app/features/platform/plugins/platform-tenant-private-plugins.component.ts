import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  PluginCatalogItem,
  SharpButtonComponent,
  SharpToggleComponent,
  TranslatePipe,
  apiMessage,
} from '@shared';
import { PlatformPluginService } from '../../../core/services/platform-plugin.service';

@Component({
  selector: 'app-platform-tenant-private-plugins',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DrawerComponent, SharpButtonComponent, SharpToggleComponent],
  templateUrl: './platform-tenant-private-plugins.component.html',
})
export class PlatformTenantPrivatePluginsComponent implements OnInit {
  private service = inject(PlatformPluginService);
  private i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  items = signal<PluginCatalogItem[]>([]);
  loading = signal(false);
  errorText = signal('');
  successText = signal('');

  blockOpen = signal(false);
  blockTarget = signal<PluginCatalogItem | null>(null);
  blockReason = signal('');
  blockForce = signal(false);
  blockConfirm = signal('');
  blockBusy = signal(false);

  ngOnInit(): void {
    this.load();
    this.route.queryParamMap.subscribe((params) => this.applyQuery(params));
  }

  private applyQuery(params: ParamMap): void {
    const drawer = params.get('drawer');
    const plugin = params.get('plugin');
    const match = plugin ? this.items().find((entry) => entry.plugin_key === plugin) ?? null : null;
    this.blockOpen.set(drawer === 'block' && !!match);
    this.blockTarget.set(drawer === 'block' ? match : null);
  }

  setQuery(partial: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: partial,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  closeDrawer(): void {
    this.setQuery({ drawer: null, plugin: null });
  }

  load(): void {
    this.loading.set(true);
    this.service.tenantPrivatePlugins().subscribe({
      next: (response) => {
        this.items.set(response.data?.items ?? []);
        this.loading.set(false);
        this.applyQuery(this.route.snapshot.queryParamMap);
      },
      error: (error: ApiErrorResponse) => {
        this.errorText.set(apiMessage(this.i18n, error));
        this.loading.set(false);
      },
    });
  }

  openBlock(item: PluginCatalogItem): void {
    this.blockReason.set('');
    this.blockForce.set(false);
    this.blockConfirm.set('');
    this.setQuery({ drawer: 'block', plugin: item.plugin_key });
  }

  canConfirm(): boolean {
    const target = this.blockTarget();
    return !!target && this.blockReason().trim().length > 0 && this.blockConfirm().trim() === target.plugin_key;
  }

  submitBlock(): void {
    const target = this.blockTarget();
    if (!target || !this.canConfirm()) {
      return;
    }
    this.blockBusy.set(true);
    this.service.blockTenantPrivate(target.plugin_key, {
      reason: this.blockReason(),
      scope: 'CATALOG',
      version: null,
      force_uninstall: this.blockForce(),
      confirmations: { affected_tenants: 0, confirm_text: this.blockConfirm() },
    }).subscribe({
      next: () => {
        this.blockBusy.set(false);
        this.setQuery({ drawer: null, plugin: null });
        this.successText.set(this.i18n.t('PLUGIN_BLOCK_SUCCESS'));
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.blockBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }
}
