import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  PlatformTenant,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TenantPlanTier,
  TranslatePipe
} from '@shared';

import { PlatformService } from '../../../core/services/platform.service';

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
  readonly plugins = signal<string[]>(['core']);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  readonly pluginOptions: readonly string[] = ['core', 'sales', 'accounting', 'inventory', 'crm'];

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
        this.plugins.set([...(current.allowed_plugins || ['core'])]);
      }
    });
    effect(() => {
      if (!this.isOpen()) {
        this.errorText.set('');
      }
    });
  }

  togglePlugin(plugin: string, checked: boolean) {
    const current = this.plugins();
    if (checked) {
      this.plugins.set(current.includes(plugin) ? current : [...current, plugin]);
    } else {
      this.plugins.set(current.filter((item) => item !== plugin));
    }
  }

  isPluginChecked(plugin: string): boolean {
    return this.plugins().includes(plugin);
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
        allowed_plugins: this.plugins()
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

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
