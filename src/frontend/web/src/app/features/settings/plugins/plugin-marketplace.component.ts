import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  DrawerComponent,
  I18nService,
  PluginCatalogDetail,
  PluginManagementListComponent,
  PluginMarketplaceItem,
  OperationProgressComponent,
  PluginNotification,
  PluginOperationStatus,
  PluginVersionItem,
  SharpButtonComponent,
  SharpToggleComponent,
  TranslatePipe,
  VersionTimelineComponent,
  apiMessage,
} from '@shared';
import { ApiErrorResponse } from '@shared';
import { PluginService } from '../../../core/services/plugin.service';
import { TenantPluginRegisterDrawerComponent } from './tenant-plugin-register-drawer.component';

const TERMINAL_STATUSES = ['ACTIVE', 'INACTIVE', 'UNINSTALLED', 'INSTALL_FAILED', 'ROLLBACK_FAILED'];

@Component({
  selector: 'app-plugin-marketplace',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    PluginManagementListComponent,
    DrawerComponent,
    VersionTimelineComponent,
    OperationProgressComponent,
    SharpButtonComponent,
    SharpToggleComponent,
    TenantPluginRegisterDrawerComponent,
  ],
  templateUrl: './plugin-marketplace.component.html',
})
export class PluginMarketplaceComponent implements OnInit, OnDestroy {
  private pluginService = inject(PluginService);
  private i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  items = signal<PluginMarketplaceItem[]>([]);
  loading = signal(false);
  errorText = signal('');
  successText = signal('');
  busyKey = signal<string | null>(null);

  selectedKey = signal<string | null>(null);
  detailOpen = signal(false);
  detail = signal<PluginCatalogDetail | null>(null);
  detailLoading = signal(false);

  operation = signal<PluginOperationStatus | null>(null);
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  upgradeOpen = signal(false);
  upgradeItem = signal<PluginMarketplaceItem | null>(null);
  upgradeVersion = signal<string>('');
  upgradeSnapshot = signal(false);

  uninstallOpen = signal(false);
  uninstallItem = signal<PluginMarketplaceItem | null>(null);

  notificationsOpen = signal(false);
  notifications = signal<PluginNotification[]>([]);

  registerOpen = signal(false);
  manageKey = signal<string | null>(null);

  private loadedDetailKey: string | null = null;

  ngOnInit(): void {
    this.refresh();
    this.loadNotifications();
    this.route.queryParamMap.subscribe((params) => this.applyQuery(params));
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private applyQuery(params: ParamMap): void {
    const plugin = params.get('plugin');
    const drawer = params.get('drawer');

    if (plugin && plugin !== this.loadedDetailKey) {
      this.loadedDetailKey = plugin;
      this.selectedKey.set(plugin);
      this.loadDetail(plugin);
    } else if (!plugin) {
      this.loadedDetailKey = null;
      this.selectedKey.set(null);
      this.detail.set(null);
    }

    const item = plugin ? this.items().find((entry) => entry.plugin_key === plugin) ?? null : null;

    this.detailOpen.set(drawer === 'detail');
    this.upgradeOpen.set(drawer === 'upgrade');
    if (drawer === 'upgrade' && item) {
      this.upgradeItem.set(item);
      this.upgradeVersion.set(item.latest_version ?? '');
      this.upgradeSnapshot.set(false);
    }
    this.uninstallOpen.set(drawer === 'uninstall');
    if (drawer === 'uninstall') {
      this.uninstallItem.set(item);
    }
    this.notificationsOpen.set(drawer === 'notifications');
    this.registerOpen.set(drawer === 'register' || drawer === 'manage');
    this.manageKey.set(drawer === 'manage' ? plugin : null);

    if (drawer === 'detail' && plugin && !this.detail()) {
      this.loadDetail(plugin);
    }
  }

  setQuery(partial: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: partial,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  closeAllDrawers(): void {
    this.stopPolling();
    this.setQuery({ drawer: null });
  }

  refresh(): void {
    this.loading.set(true);
    this.pluginService.marketplace().subscribe({
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

  loadNotifications(): void {
    this.pluginService.notifications().subscribe({
      next: (response) => this.notifications.set(response.data?.items ?? []),
      error: () => this.notifications.set([]),
    });
  }

  unreadCount(): number {
    return this.notifications().filter((item) => !item.read_at).length;
  }

  blockedItems(): PluginMarketplaceItem[] {
    return this.items().filter((item) => item.catalog_status === 'BLOCKED');
  }

  openDetail(item: PluginMarketplaceItem): void {
    this.setQuery({ plugin: item.plugin_key, drawer: 'detail' });
  }

  loadDetail(pluginKey: string): void {
    this.detailLoading.set(true);
    this.pluginService.detail(pluginKey).subscribe({
      next: (response) => {
        this.detail.set(response.data ?? null);
        this.detailLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.errorText.set(apiMessage(this.i18n, error));
        this.detailLoading.set(false);
      },
    });
  }

  install(item: PluginMarketplaceItem): void {
    this.runLifecycle(item.plugin_key, () => this.pluginService.install(item.plugin_key, item.latest_version));
  }

  enable(item: PluginMarketplaceItem): void {
    this.runLifecycle(item.plugin_key, () => this.pluginService.enable(item.plugin_key));
  }

  disable(item: PluginMarketplaceItem): void {
    this.runLifecycle(item.plugin_key, () => this.pluginService.disable(item.plugin_key));
  }

  openUpgrade(item: PluginMarketplaceItem): void {
    this.upgradeItem.set(item);
    this.upgradeVersion.set(item.latest_version ?? '');
    this.upgradeSnapshot.set(false);
    this.setQuery({ plugin: item.plugin_key, drawer: 'upgrade' });
    if (this.detailKey() !== item.plugin_key) {
      this.pluginService.detail(item.plugin_key).subscribe({
        next: (response) => this.detail.set(response.data ?? null),
      });
    }
  }

  upgradeTargets(): PluginVersionItem[] {
    const current = this.upgradeItem()?.installed_version ?? '';
    return (this.detail()?.version ?? []).filter(
      (version) => version.release_status === 'PUBLISHED' && version.version !== current
    );
  }

  selectedTarget(): PluginVersionItem | null {
    const target = this.upgradeVersion();
    return (this.detail()?.version ?? []).find((version) => version.version === target) ?? null;
  }

  upgradeRequiresSnapshot(): boolean {
    return this.selectedTarget()?.migration_policy === 'BREAKING';
  }

  confirmUpgrade(): void {
    const item = this.upgradeItem();
    const target = this.upgradeVersion();
    if (!item || !target) {
      return;
    }
    this.setQuery({ drawer: null });
    this.runLifecycle(item.plugin_key, () =>
      this.pluginService.upgrade(item.plugin_key, target, this.upgradeRequiresSnapshot() ? true : this.upgradeSnapshot())
    );
  }

  openUninstall(item: PluginMarketplaceItem): void {
    this.setQuery({ plugin: item.plugin_key, drawer: 'uninstall' });
  }

  confirmUninstall(): void {
    const item = this.uninstallItem();
    if (!item) {
      return;
    }
    this.setQuery({ drawer: null });
    this.runLifecycle(item.plugin_key, () => this.pluginService.uninstall(item.plugin_key));
  }

  openNotifications(): void {
    this.loadNotifications();
    this.setQuery({ drawer: 'notifications' });
  }

  markAllRead(): void {
    this.pluginService.markAllNotificationsRead().subscribe({
      next: () => this.loadNotifications(),
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  closeDetail(): void {
    this.stopPolling();
    this.setQuery({ plugin: null, drawer: null });
  }

  openRegister(): void {
    this.manageKey.set(null);
    this.setQuery({ plugin: null, drawer: 'register' });
  }

  openManageVersions(): void {
    const key = this.detail()?.plugin_key;
    if (!key) {
      return;
    }
    this.manageKey.set(key);
    this.setQuery({ plugin: key, drawer: 'manage' });
  }

  isCustomDetail(): boolean {
    return this.detail()?.visibility === 'TENANT_PRIVATE';
  }

  deleteCustomCatalog(): void {
    const key = this.detail()?.plugin_key;
    if (!key) {
      return;
    }
    this.pluginService.deleteCustomCatalog(key).subscribe({
      next: () => {
        this.successText.set(this.i18n.t('PLUGIN_CATALOG_DELETE_SUCCESS'));
        this.closeDetail();
        this.detail.set(null);
        this.refresh();
      },
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  onRegisterClosed(): void {
    this.setQuery({ drawer: null });
  }

  onRegisterChanged(): void {
    this.refresh();
  }

  selectedInstalledVersion(): string | null {
    const key = this.detail()?.plugin_key;
    return this.items().find((item) => item.plugin_key === key)?.installed_version ?? null;
  }

  private detailKey(): string | null {
    return this.detail()?.plugin_key ?? null;
  }

  private runLifecycle(pluginKey: string, action: () => ReturnType<PluginService['install']>): void {
    this.busyKey.set(pluginKey);
    this.errorText.set('');
    this.successText.set('');
    action().subscribe({
      next: (response) => {
        this.busyKey.set(null);
        this.successText.set(this.i18n.t('PLUGIN_OPERATION_STARTED'));
        const operation = response.data;
        if (operation?.operation_id) {
          this.operation.set(operation);
          if (!TERMINAL_STATUSES.includes(operation.status)) {
            this.startPolling(operation.operation_id);
          }
        }
        this.refresh();
        this.loadNotifications();
      },
      error: (error: ApiErrorResponse) => {
        this.busyKey.set(null);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  private startPolling(operationId: string): void {
    this.stopPolling();
    this.pollHandle = setInterval(() => {
      this.pluginService.operation(operationId).subscribe({
        next: (response) => {
          const operation = response.data ?? null;
          this.operation.set(operation);
          if (operation && TERMINAL_STATUSES.includes(operation.status)) {
            this.stopPolling();
            this.refresh();
            const key = this.detailKey();
            if (key) {
              this.loadDetail(key);
            }
          }
        },
        error: () => this.stopPolling(),
      });
    }, 1500);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}
