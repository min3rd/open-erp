import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActionSheetButton,
  ActionSheetController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { PlatformService } from '../../../core/platform.service';
import {
  BadgeComponent,
  BadgeVariant,
  ButtonVariant,
  HealthSnapshot,
  I18nService,
  PlatformTenant,
  PlatformUser,
  SharpButtonComponent,
  SharpInputComponent,
  SubsystemStatus,
  SystemHealthStatus,
  TenantStatus,
  TranslateDirective,
  TranslatePipe,
  UserStatus,
  apiMessage
} from '@shared';

interface TenantActionTarget {
  tenant: PlatformTenant;
  action: 'lock' | 'unlock';
}

@Component({
  selector: 'app-emergency',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    BadgeComponent,
    SharpButtonComponent,
    SharpInputComponent,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './emergency.page.html'
})
export class EmergencyPage implements OnInit {
  private platform = inject(PlatformService);
  private actionSheetCtrl = inject(ActionSheetController);
  private i18n = inject(I18nService);

  readonly badgeDanger = BadgeVariant.DANGER;
  readonly buttonDanger = ButtonVariant.DANGER;
  readonly buttonSecondary = ButtonVariant.SECONDARY;

  health = signal<HealthSnapshot | null>(null);
  tenants = signal<PlatformTenant[]>([]);
  users = signal<PlatformUser[]>([]);

  loading = signal<boolean>(true);
  usersLoading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  userKeyword = '';
  tenantTarget = signal<TenantActionTarget | null>(null);
  confirmPassword = '';
  lockReason = '';

  activeTenantCount = computed<number>(() => {
    const metrics = this.health()?.platform_metrics;
    if (metrics && typeof metrics.active_tenants === 'number') {
      return metrics.active_tenants;
    }
    return this.tenants().filter(tenant => tenant.status === TenantStatus.ACTIVE).length;
  });

  storageAlertCount = computed<number>(() =>
    this.tenants().filter(tenant => this.storagePercent(tenant) >= 80).length
  );

  ngOnInit() {
    this.load();
    this.loadUsers();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      health: this.platform.getHealth(),
      tenants: this.platform.getTenants({ page: 0, size: 20 })
    }).subscribe({
      next: result => {
        this.health.set(result.health.data);
        this.tenants.set(result.tenants.data?.items || []);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  loadUsers() {
    this.usersLoading.set(true);
    this.platform.getUsers({ page: 0, size: 10, keyword: this.userKeyword.trim() }).subscribe({
      next: res => {
        this.users.set(res.data?.items || []);
        this.usersLoading.set(false);
      },
      error: err => {
        this.usersLoading.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  storagePercent(tenant: PlatformTenant): number {
    if (!tenant.max_storage_mb) {
      return 0;
    }
    return Math.round((tenant.used_storage_mb / tenant.max_storage_mb) * 100);
  }

  tenantStatusVariant(tenant: PlatformTenant): BadgeVariant {
    return tenant.status === TenantStatus.ACTIVE ? BadgeVariant.SUCCESS : BadgeVariant.DEFAULT;
  }

  userStatusVariant(user: PlatformUser): BadgeVariant {
    switch (user.status) {
      case UserStatus.ACTIVE:
        return BadgeVariant.SUCCESS;
      case UserStatus.LOCKED:
        return BadgeVariant.DANGER;
      default:
        return BadgeVariant.DEFAULT;
    }
  }

  isUserLocked(user: PlatformUser): boolean {
    return user.status === UserStatus.LOCKED;
  }

  subsystemDotClass(status: SubsystemStatus | undefined): string {
    switch (status) {
      case SubsystemStatus.UP:
        return 'bg-emerald-500';
      case SubsystemStatus.DOWN:
        return 'bg-rose-500';
      default:
        return 'bg-amber-500';
    }
  }

  systemStatusVariant(): BadgeVariant {
    switch (this.health()?.system_status) {
      case SystemHealthStatus.HEALTHY:
        return BadgeVariant.SUCCESS;
      case SystemHealthStatus.DOWN:
        return BadgeVariant.DANGER;
      default:
        return BadgeVariant.WARNING;
    }
  }

  openTenantPanel(tenant: PlatformTenant, action: 'lock' | 'unlock') {
    this.error.set(null);
    this.success.set(null);
    this.confirmPassword = '';
    this.lockReason = '';
    this.tenantTarget.set({ tenant, action });
  }

  closeTenantPanel() {
    this.tenantTarget.set(null);
    this.confirmPassword = '';
    this.lockReason = '';
  }

  async confirmTenantAction() {
    const target = this.tenantTarget();
    if (!target) {
      return;
    }
    if (!this.confirmPassword.trim()) {
      this.error.set(this.i18n.t('PLATFORM_EMERGENCY_PASSWORD_REQUIRED'));
      return;
    }
    if (target.action === 'lock' && !this.lockReason.trim()) {
      this.error.set(this.i18n.t('PLATFORM_EMERGENCY_REASON_REQUIRED'));
      return;
    }

    const isLock = target.action === 'lock';
    const buttons: ActionSheetButton[] = [
      {
        text: this.i18n.t(isLock ? 'PLATFORM_EMERGENCY_CONFIRM_LOCK' : 'PLATFORM_EMERGENCY_CONFIRM_UNLOCK'),
        role: isLock ? 'destructive' : undefined,
        handler: () => {
          this.submitTenantAction(target);
          return true;
        }
      },
      {
        text: this.i18n.t('COMMON_CANCEL'),
        role: 'cancel'
      }
    ];

    const sheet = await this.actionSheetCtrl.create({
      header: target.tenant.name,
      subHeader: this.i18n.t(isLock ? 'PLATFORM_EMERGENCY_LOCK_TITLE' : 'PLATFORM_EMERGENCY_UNLOCK_TITLE'),
      buttons
    });
    await sheet.present();
  }

  async confirmUserAction(user: PlatformUser, action: 'lock' | 'unlock') {
    const isLock = action === 'lock';
    const buttons: ActionSheetButton[] = [
      {
        text: this.i18n.t(isLock ? 'PLATFORM_EMERGENCY_USER_LOCK' : 'PLATFORM_EMERGENCY_USER_UNLOCK'),
        role: isLock ? 'destructive' : undefined,
        handler: () => {
          this.submitUserAction(user, action);
          return true;
        }
      },
      {
        text: this.i18n.t('COMMON_CANCEL'),
        role: 'cancel'
      }
    ];

    const sheet = await this.actionSheetCtrl.create({
      header: user.email,
      buttons
    });
    await sheet.present();
  }

  private submitTenantAction(target: TenantActionTarget) {
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const request$ = target.action === 'lock'
      ? this.platform.lockTenant(target.tenant.tenant_id, {
        reason: this.lockReason.trim(),
        confirm_password: this.confirmPassword
      })
      : this.platform.unlockTenant(target.tenant.tenant_id, this.confirmPassword);

    request$.subscribe({
      next: res => {
        this.submitting.set(false);
        this.closeTenantPanel();
        this.success.set(this.i18n.t(res.code));
        this.load();
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  private submitUserAction(user: PlatformUser, action: 'lock' | 'unlock') {
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const request$ = action === 'lock'
      ? this.platform.lockUser(user.user_id)
      : this.platform.unlockUser(user.user_id);

    request$.subscribe({
      next: res => {
        this.submitting.set(false);
        this.success.set(this.i18n.t(res.code));
        this.loadUsers();
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }
}
