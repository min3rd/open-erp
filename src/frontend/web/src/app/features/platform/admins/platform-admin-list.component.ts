import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  BadgeComponent,
  ColorVariant,
  I18nService,
  PlatformAdmin,
  PlatformAdminRole,
  PlatformAdminStatus,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpTextareaComponent,
  TableColumn,
  TableComponent,
  TranslatePipe,
  formatDateTime
} from '@shared';
import { PlatformService } from '../../../core/services/platform.service';
import { AuthService } from '../../../core/services/auth.service';
import { ListRouteState, RouteListStateService } from '../../../core/utils/route-list-state.service';
import { GrantAdminDrawerComponent } from './grant-admin-drawer.component';

type AdminConfirmAction = 'DISABLE' | 'REVOKE' | 'DISABLE_2FA' | 'RESET_PASSWORD';

@Component({
  selector: 'app-platform-admin-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    BadgeComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpTextareaComponent,
    TranslatePipe,
    GrantAdminDrawerComponent
  ],
  providers: [RouteListStateService],
  templateUrl: './platform-admin-list.component.html'
})
export class PlatformAdminListComponent implements OnInit {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);
  private routeState = inject(RouteListStateService);

  readonly admins = signal<PlatformAdmin[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');
  readonly formatDateTime = formatDateTime;

  readonly confirmAdmin = signal<PlatformAdmin | null>(null);
  readonly confirmAction = signal<AdminConfirmAction | null>(null);
  readonly confirmReason = signal<string>('');
  readonly confirmTicket = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly confirmSaving = signal<boolean>(false);

  readonly grantOpen = signal<boolean>(false);

  readonly adminStatusDisabled = PlatformAdminStatus.DISABLED;
  readonly adminStatusInvited = PlatformAdminStatus.INVITED;
  readonly adminStatusRevoked = PlatformAdminStatus.REVOKED;
  readonly confirmDisable2Fa: AdminConfirmAction = 'DISABLE_2FA';
  readonly confirmResetPassword: AdminConfirmAction = 'RESET_PASSWORD';

  readonly currentUserId = computed(() => this.auth.user()?.user_id || this.auth.user()?.id || '');
  readonly activeAdmins = computed(() => this.admins().filter((admin) => admin.status === PlatformAdminStatus.ACTIVE));
  readonly isLastActiveAdmin = computed(() => this.activeAdmins().length <= 1);

  private loadedListKey = '';
  private loadedDrawerKey = '';
  private currentState: ListRouteState | null = null;

  readonly roleOptions: SelectOption[] = [
    { value: PlatformAdminRole.SUPER_ADMIN, labelKey: 'PLATFORM_ADMIN_ROLE_SUPER_ADMIN' },
    { value: PlatformAdminRole.SUPPORT_ENGINEER, labelKey: 'PLATFORM_ADMIN_ROLE_SUPPORT_ENGINEER' }
  ];

  readonly columns: TableColumn[] = [
    { key: 'email', labelKey: 'PLATFORM_ADMIN_COL_EMAIL' },
    { key: 'role', labelKey: 'PLATFORM_ADMIN_COL_ROLE' },
    { key: 'status', labelKey: 'PLATFORM_ADMIN_COL_STATUS' },
    { key: '2fa', labelKey: 'PLATFORM_ADMIN_COL_2FA', align: 'center' },
    { key: 'last_login_at', labelKey: 'PLATFORM_ADMIN_COL_LAST_LOGIN' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  ngOnInit() {
    this.routeState.bind((state) => this.applyState(state));
  }

  private applyState(state: ListRouteState): void {
    this.currentState = state;
    const listKey = this.routeState.listKey(state);
    if (listKey !== this.loadedListKey) {
      this.loadedListKey = listKey;
      this.load();
    }
    this.applySelection(state);
  }

  private applySelection(state: ListRouteState): void {
    const drawerKey = `${state.drawer ?? ''}|${state.id ?? ''}`;
    if (drawerKey !== this.loadedDrawerKey) {
      this.loadedDrawerKey = drawerKey;
      this.confirmReason.set('');
      this.confirmTicket.set('');
      this.confirmPassword.set('');
    }
    const admin = state.id ? this.admins().find((item) => item.admin_id === state.id) ?? null : null;
    const action = this.actionFromDrawer(state.drawer);
    if (admin && action) {
      this.confirmAdmin.set(admin);
      this.confirmAction.set(action);
    } else {
      this.confirmAdmin.set(null);
      this.confirmAction.set(null);
    }
    this.grantOpen.set(state.drawer === 'grant');
  }

  private drawerForAction(action: AdminConfirmAction): string {
    switch (action) {
      case 'DISABLE':
        return 'disable';
      case 'REVOKE':
        return 'revoke';
      case 'DISABLE_2FA':
        return 'disable2fa';
      default:
        return 'resetpassword';
    }
  }

  private actionFromDrawer(drawer: string | null): AdminConfirmAction | null {
    switch (drawer) {
      case 'disable':
        return 'DISABLE';
      case 'revoke':
        return 'REVOKE';
      case 'disable2fa':
        return 'DISABLE_2FA';
      case 'resetpassword':
        return 'RESET_PASSWORD';
      default:
        return null;
    }
  }

  load() {
    this.loading.set(true);
    this.platform.getAdmins().subscribe({
      next: (res) => {
        this.admins.set(res.data.items);
        this.loading.set(false);
        this.errorText.set('');
        if (this.currentState) {
          this.applySelection(this.currentState);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  isSelf(admin: PlatformAdmin): boolean {
    return !!this.currentUserId() && admin.user_id === this.currentUserId();
  }

  canDisable(admin: PlatformAdmin): boolean {
    if (this.isSelf(admin)) {
      return false;
    }
    if (admin.status === PlatformAdminStatus.ACTIVE && this.isLastActiveAdmin()) {
      return false;
    }
    return admin.status !== PlatformAdminStatus.DISABLED && admin.status !== PlatformAdminStatus.REVOKED;
  }

  canRevoke(admin: PlatformAdmin): boolean {
    return this.canDisable(admin);
  }

  protectionHint(admin: PlatformAdmin): string {
    if (this.isSelf(admin)) {
      return this.i18n.t('PLATFORM_SELF_DISABLE_FORBIDDEN');
    }
    if (admin.status === PlatformAdminStatus.ACTIVE && this.isLastActiveAdmin()) {
      return this.i18n.t('PLATFORM_LAST_ADMIN_PROTECTED');
    }
    return '';
  }

  roleVariant(role: PlatformAdminRole): ColorVariant {
    return role === PlatformAdminRole.SUPER_ADMIN ? ColorVariant.INFO : ColorVariant.DEFAULT;
  }

  statusVariant(status: PlatformAdminStatus): ColorVariant {
    switch (status) {
      case PlatformAdminStatus.ACTIVE:
        return ColorVariant.SUCCESS;
      case PlatformAdminStatus.INVITED:
        return ColorVariant.DEFAULT;
      case PlatformAdminStatus.DISABLED:
        return ColorVariant.WARNING;
      case PlatformAdminStatus.REVOKED:
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  askConfirm(admin: PlatformAdmin, action: AdminConfirmAction) {
    this.successText.set('');
    this.routeState.set({ drawer: this.drawerForAction(action), id: admin.admin_id });
  }

  cancelConfirm() {
    this.routeState.set({ drawer: null, id: null });
  }

  submitConfirm() {
    const admin = this.confirmAdmin();
    const action = this.confirmAction();
    if (!admin || !action) {
      return;
    }
    if (action !== 'RESET_PASSWORD') {
      if (!this.confirmReason().trim()) {
        this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
        return;
      }
      if (!this.confirmPassword()) {
        this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
        return;
      }
    }
    if (action === 'DISABLE_2FA' && !this.confirmTicket().trim()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }

    this.confirmSaving.set(true);
    const lifecyclePayload = {
      reason: this.confirmReason().trim(),
      confirm_password: this.confirmPassword()
    };
    const request =
      action === 'DISABLE'
        ? this.platform.disableAdmin(admin.admin_id, lifecyclePayload)
        : action === 'REVOKE'
          ? this.platform.revokeAdmin(admin.admin_id, lifecyclePayload)
          : action === 'DISABLE_2FA'
            ? this.platform.disableAdmin2Fa(admin.admin_id, {
                support_ticket: this.confirmTicket().trim(),
                reason: lifecyclePayload.reason,
                confirm_password: lifecyclePayload.confirm_password
              })
            : this.platform.resetAdminPassword(admin.admin_id);

    request.subscribe({
      next: (res) => {
        this.confirmSaving.set(false);
        this.routeState.set({ drawer: null, id: null });
        this.successText.set(this.i18n.t(res.code, res.params));
        this.errorText.set('');
        this.load();
      },
      error: (err) => {
        this.confirmSaving.set(false);
        this.showError(err);
      }
    });
  }

  enableAdmin(admin: PlatformAdmin) {
    this.platform.enableAdmin(admin.admin_id).subscribe({
      next: (res) => {
        this.successText.set(this.i18n.t(res.code, res.params));
        this.errorText.set('');
        this.load();
      },
      error: (err) => this.showError(err)
    });
  }

  openGrant() {
    this.successText.set('');
    this.routeState.set({ drawer: 'grant', id: null });
  }

  closeGrant() {
    this.routeState.set({ drawer: null, id: null });
  }

  onAdminGranted(code: string) {
    this.routeState.set({ drawer: null, id: null });
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
    this.successText.set('');
  }
}
