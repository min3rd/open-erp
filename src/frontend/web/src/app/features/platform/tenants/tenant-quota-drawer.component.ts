import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  PlatformPlugin,
  PlatformTenant,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TenantPlanTier,
  TranslatePipe
} from '@shared';

import { PlatformService } from '../../../core/services/platform.service';
import { PluginSwitchListComponent, PluginToggleEvent } from './plugin-switch-list.component';

const CORE_PLUGIN_KEY = 'core';

const FALLBACK_PLUGIN_CATALOG: PlatformPlugin[] = [
  { key: 'core', name_key: 'PLUGIN_CORE_NAME', description_key: 'PLUGIN_CORE_DESCRIPTION', is_core: true },
  { key: 'sales', name_key: 'PLUGIN_SALES_NAME', description_key: 'PLUGIN_SALES_DESCRIPTION', is_core: false },
  { key: 'accounting', name_key: 'PLUGIN_ACCOUNTING_NAME', description_key: 'PLUGIN_ACCOUNTING_DESCRIPTION', is_core: false },
  { key: 'inventory', name_key: 'PLUGIN_INVENTORY_NAME', description_key: 'PLUGIN_INVENTORY_DESCRIPTION', is_core: false },
  { key: 'crm', name_key: 'PLUGIN_CRM_NAME', description_key: 'PLUGIN_CRM_DESCRIPTION', is_core: false }
];

@Component({
  selector: 'app-tenant-quota-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpButtonComponent,
    PluginSwitchListComponent,
    TranslatePipe
  ],
  templateUrl: './tenant-quota-drawer.component.html'
})
export class TenantQuotaDrawerComponent {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  tenant = input<PlatformTenant | null>(null);

  close = output<void>();
  saved = output<string>();

  readonly planTier = signal<string>(TenantPlanTier.STANDARD);
  readonly maxUsers = signal<string>('0');
  readonly maxStorageMb = signal<string>('0');
  readonly plugins = signal<string[]>([CORE_PLUGIN_KEY]);
  readonly catalog = signal<PlatformPlugin[]>(FALLBACK_PLUGIN_CATALOG);
  readonly catalogFallback = signal<boolean>(false);
  readonly catalogLoaded = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly warningText = signal<string>('');

  readonly planOptions: SelectOption[] = [
    { value: TenantPlanTier.COMMUNITY, labelKey: 'PLATFORM_PLAN_COMMUNITY' },
    { value: TenantPlanTier.STANDARD, labelKey: 'PLATFORM_PLAN_STANDARD' },
    { value: TenantPlanTier.ENTERPRISE, labelKey: 'PLATFORM_PLAN_ENTERPRISE' }
  ];

  constructor() {
    effect(() => {
      const current = this.tenant();
      if (current) {
        this.planTier.set(current.plan_tier);
        this.maxUsers.set(String(current.max_users));
        this.maxStorageMb.set(String(current.max_storage_mb));
        if (current.allowed_plugins) {
          this.plugins.set(this.normalizeSelection(current.allowed_plugins));
        } else {
          // BUG-74 fallback: list payload might omit allowed_plugins; use the detail endpoint.
          this.plugins.set([CORE_PLUGIN_KEY]);
          this.loadTenantDetail(current.tenant_id);
        }
      }
    });
    effect(() => {
      if (this.isOpen() && !this.catalogLoaded()) {
        this.loadCatalog();
      }
      if (!this.isOpen()) {
        this.errorText.set('');
        this.warningText.set('');
      }
    });
  }

  onPluginToggled(event: PluginToggleEvent) {
    this.togglePlugin(event.key, event.checked);
    if (event.checked) {
      this.warningText.set('');
      return;
    }
    const item = this.catalog().find((entry) => entry.key === event.key);
    if (!item || !item.name_key) {
      this.warningText.set(
        this.i18n.t('PLATFORM_TENANT_QUOTA_PLUGIN_UNKNOWN_DISABLE_WARNING', { name: event.key })
      );
      return;
    }
    const name = this.i18n.t(item.name_key);
    this.warningText.set(this.i18n.t('PLATFORM_TENANT_QUOTA_PLUGIN_DISABLE_WARNING', { name }));
  }

  togglePlugin(plugin: string, checked: boolean) {
    const current = this.plugins();
    if (checked) {
      this.plugins.set(current.includes(plugin) ? current : [...current, plugin]);
    } else if (plugin !== CORE_PLUGIN_KEY) {
      this.plugins.set(current.filter((item) => item !== plugin));
    }
  }

  userPercent(): number {
    const current = this.tenant();
    const max = Number(this.maxUsers());
    if (!current || !max) {
      return 0;
    }
    return Math.min(100, Math.round((current.active_users_count / max) * 100));
  }

  storagePercent(): number {
    const current = this.tenant();
    const max = Number(this.maxStorageMb());
    if (!current || !max) {
      return 0;
    }
    return Math.min(100, Math.round((current.used_storage_mb / max) * 100));
  }

  onClose() {
    this.close.emit();
  }

  save() {
    const current = this.tenant();
    if (!current) {
      return;
    }
    const maxUsers = Number(this.maxUsers());
    const maxStorage = Number(this.maxStorageMb());
    if (!Number.isFinite(maxUsers) || maxUsers < 1) {
      this.errorText.set(this.i18n.t('PLATFORM_TENANT_QUOTA_INVALID_USERS'));
      return;
    }
    if (!Number.isFinite(maxStorage) || maxStorage < 1) {
      this.errorText.set(this.i18n.t('PLATFORM_TENANT_QUOTA_INVALID_STORAGE'));
      return;
    }
    this.saving.set(true);
    this.platform
      .updateTenantQuotas(current.tenant_id, {
        plan_tier: this.planTier() as TenantPlanTier,
        max_users: Math.floor(maxUsers),
        max_storage_mb: Math.floor(maxStorage),
        allowed_plugins: this.normalizeSelection(this.plugins())
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.saved.emit(res.code);
          this.onClose();
        },
        error: (err) => {
          this.saving.set(false);
          this.showError(err);
        }
      });
  }

  private loadCatalog() {
    this.platform.getPlugins().subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.catalog.set(this.mergeCatalog(items));
        this.catalogFallback.set(!items.length);
        this.catalogLoaded.set(true);
        this.plugins.set(this.normalizeSelection(this.plugins()));
      },
      error: () => {
        this.catalog.set(this.mergeCatalog([]));
        this.catalogFallback.set(true);
        this.catalogLoaded.set(true);
        this.plugins.set(this.normalizeSelection(this.plugins()));
      }
    });
  }

  private mergeCatalog(items: PlatformPlugin[]): PlatformPlugin[] {
    const byKey = new Map<string, PlatformPlugin>();
    for (const item of [...items, ...FALLBACK_PLUGIN_CATALOG]) {
      if (!byKey.has(item.key)) {
        byKey.set(item.key, item);
      }
    }
    for (const key of this.plugins()) {
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          name_key: '',
          description_key: '',
          is_core: key === CORE_PLUGIN_KEY
        });
      }
    }
    return Array.from(byKey.values());
  }

  private loadTenantDetail(tenantId: string) {
    this.platform.getTenant(tenantId).subscribe({
      next: (res) => {
        const detail = res.data;
        if (!detail) {
          return;
        }
        this.planTier.set(detail.plan_tier);
        this.maxUsers.set(String(detail.max_users));
        this.maxStorageMb.set(String(detail.max_storage_mb));
        this.plugins.set(this.normalizeSelection(detail.allowed_plugins));
      },
      error: () => {
        // Keep the current selection; save always re-adds the mandatory core plugin.
      }
    });
  }

  private normalizeSelection(plugins: Array<string | null | undefined> | null | undefined): string[] {
    const selected = new Set(
      (plugins || [])
        .map((item) => (item || '').trim().toLowerCase())
        .filter((item) => !!item)
    );
    selected.add(CORE_PLUGIN_KEY);
    const catalogOrder = this.catalog().map((item) => item.key);
    const ordered = catalogOrder.filter((key) => selected.has(key));
    const extras = Array.from(selected).filter((key) => !catalogOrder.includes(key));
    return [...ordered, ...extras];
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
