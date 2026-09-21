import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ApiErrorResponse,
  BadgeComponent,
  ColorVariant,
  I18nService,
  ImpersonationSessionData,
  PaginationComponent,
  PlatformTenant,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TableColumn,
  TableComponent,
  TenantStatus,
  TranslatePipe,
  formatDateTime
} from '@shared';

import { PlatformService } from '../../../core/services/platform.service';
import { AuthService } from '../../../core/services/auth.service';
import { ImpersonationService } from '../../../core/services/impersonation.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';
import { TenantQuotaDrawerComponent } from './tenant-quota-drawer.component';
import { ImpersonateConfirmDrawerComponent } from './impersonate-confirm-drawer.component';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    PaginationComponent,
    BadgeComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    TranslatePipe,
    TenantQuotaDrawerComponent,
    ImpersonateConfirmDrawerComponent
  ],
  providers: [PathListStateService],
  templateUrl: './tenant-list.component.html'
})
export class TenantListComponent implements OnInit {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);
  private router = inject(Router);
  private impersonation = inject(ImpersonationService);
  private auth = inject(AuthService);
  private listState = inject(PathListStateService);

  /** SUPPORT_ENGINEER is read-only (backend rejects all non-GET platform calls). */
  readonly isSuperAdmin = this.auth.isPlatformSuperAdmin;

  readonly tenants = signal<PlatformTenant[]>([]);
  readonly loading = signal<boolean>(false);
  readonly page = signal<number>(0);
  readonly size = signal<number>(20);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly statusFilter = signal<string>('');
  readonly keyword = signal<string>('');
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  readonly confirmAction = signal<{ type: 'LOCK' | 'UNLOCK'; tenant: PlatformTenant } | null>(null);
  readonly confirmReason = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly confirmSaving = signal<boolean>(false);

  readonly quotaTenant = signal<PlatformTenant | null>(null);
  readonly quotaOpen = signal<boolean>(false);
  readonly impersonateTenant = signal<PlatformTenant | null>(null);
  readonly impersonateOpen = signal<boolean>(false);

  readonly formatDateTime = formatDateTime;

  private loadedListKey = '';
  private loadedDrawerKey = '';
  private currentState: PathListState | null = null;

  readonly columns: TableColumn[] = [
    { key: 'name', labelKey: 'PLATFORM_TENANT_COL_NAME' },
    { key: 'type', labelKey: 'PLATFORM_TENANT_COL_TYPE' },
    { key: 'plan_tier', labelKey: 'PLATFORM_TENANT_COL_PLAN' },
    { key: 'status', labelKey: 'PLATFORM_TENANT_COL_STATUS' },
    { key: 'users', labelKey: 'PLATFORM_TENANT_COL_USERS', align: 'right' },
    { key: 'storage', labelKey: 'PLATFORM_TENANT_COL_STORAGE', align: 'right' },
    { key: 'created_at', labelKey: 'PLATFORM_TENANT_COL_CREATED' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  readonly statusOptions: SelectOption[] = [
    { value: '', labelKey: 'COMMON_ALL' },
    { value: TenantStatus.ACTIVE, labelKey: 'TENANT_STATUS_ACTIVE' },
    { value: TenantStatus.TRIAL, labelKey: 'TENANT_STATUS_TRIAL' },
    { value: TenantStatus.SUSPENDED, labelKey: 'TENANT_STATUS_SUSPENDED' },
    { value: TenantStatus.EXPIRED, labelKey: 'TENANT_STATUS_EXPIRED' },
    { value: TenantStatus.PENDING_DELETION, labelKey: 'TENANT_STATUS_PENDING_DELETION' },
    { value: TenantStatus.DELETED, labelKey: 'TENANT_STATUS_DELETED' }
  ];

  ngOnInit() {
    this.listState.bind('/platform/tenants', (state, keyword) => this.applyState(state, keyword));
  }

  private applyState(state: PathListState, keyword: string): void {
    this.page.set(state.page - 1);
    this.size.set(state.pageSize);
    this.keyword.set(keyword);
    this.statusFilter.set(state.filter === 'all' ? '' : state.filter);
    this.currentState = state;
    const listKey = this.listState.listKey(state);
    if (listKey !== this.loadedListKey) {
      this.loadedListKey = listKey;
      this.load();
    }
    this.applySelection(state);
  }

  private applySelection(state: PathListState): void {
    const drawerKey = `${state.mode}|${state.id ?? ''}`;
    if (drawerKey !== this.loadedDrawerKey) {
      this.loadedDrawerKey = drawerKey;
      this.confirmReason.set('');
      this.confirmPassword.set('');
    }
    const tenant = state.id ? this.tenants().find((item) => item.tenant_id === state.id) ?? null : null;
    const canManage = this.isSuperAdmin();

    this.quotaTenant.set(state.mode === 'quota' ? tenant : null);
    this.quotaOpen.set(state.mode === 'quota' && !!tenant && canManage);

    this.impersonateTenant.set(state.mode === 'impersonate' ? tenant : null);
    this.impersonateOpen.set(state.mode === 'impersonate' && !!tenant && canManage);

    if (canManage && tenant && (state.mode === 'lock' || state.mode === 'unlock')) {
      this.confirmAction.set({ type: state.mode === 'lock' ? 'LOCK' : 'UNLOCK', tenant });
    } else {
      this.confirmAction.set(null);
    }
  }

  private updateState(patch: Partial<PathListState>, keyword?: string | null): void {
    this.listState.set(patch, keyword);
  }

  load() {
    this.loading.set(true);
    this.platform
      .getTenants({
        page: this.page(),
        size: this.size(),
        status: (this.statusFilter() as TenantStatus) || '',
        keyword: this.keyword()
      })
      .subscribe({
        next: (res) => {
          this.tenants.set(res.data.items);
          this.totalItems.set(res.data.total_items);
          this.totalPages.set(res.data.total_pages);
          this.loading.set(false);
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

  onStatusChange(value: string) {
    this.updateState({ filter: value || 'all', page: 1, id: null, mode: 'list' });
  }

  applyFilters() {
    this.updateState({ page: 1, id: null, mode: 'list' }, this.keyword());
  }

  resetFilters() {
    this.updateState({ filter: 'all', sort: '-', pageSize: 20, page: 1, id: null, mode: 'list' }, '');
  }

  changePage(nextPage: number) {
    this.updateState({ page: nextPage + 1 });
  }

  userQuotaPercent(tenant: PlatformTenant): number {
    if (!tenant.max_users) {
      return 0;
    }
    return Math.min(100, Math.round((tenant.active_users_count / tenant.max_users) * 100));
  }

  storagePercent(tenant: PlatformTenant): number {
    if (!tenant.max_storage_mb) {
      return 0;
    }
    return Math.min(100, Math.round((tenant.used_storage_mb / tenant.max_storage_mb) * 100));
  }

  statusVariant(status: TenantStatus): ColorVariant {
    switch (status) {
      case TenantStatus.ACTIVE:
        return ColorVariant.SUCCESS;
      case TenantStatus.TRIAL:
        return ColorVariant.INFO;
      case TenantStatus.SUSPENDED:
        return ColorVariant.DANGER;
      case TenantStatus.EXPIRED:
      case TenantStatus.PENDING_DELETION:
        return ColorVariant.WARNING;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  askLock(tenant: PlatformTenant) {
    if (!this.isSuperAdmin()) {
      return;
    }
    this.successText.set('');
    this.updateState({ mode: 'lock', id: tenant.tenant_id });
  }

  askUnlock(tenant: PlatformTenant) {
    if (!this.isSuperAdmin()) {
      return;
    }
    this.successText.set('');
    this.updateState({ mode: 'unlock', id: tenant.tenant_id });
  }

  cancelConfirm() {
    this.updateState({ mode: 'list', id: null });
  }

  submitConfirm() {
    const action = this.confirmAction();
    if (!action) {
      return;
    }
    if (action.type === 'LOCK' && !this.confirmReason().trim()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    if (!this.confirmPassword()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    this.confirmSaving.set(true);
    const request =
      action.type === 'LOCK'
        ? this.platform.lockTenant(action.tenant.tenant_id, this.confirmReason(), this.confirmPassword())
        : this.platform.unlockTenant(action.tenant.tenant_id, this.confirmPassword());

    request.subscribe({
      next: (res) => {
        this.confirmSaving.set(false);
        this.updateState({ mode: 'list', id: null });
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

  openQuota(tenant: PlatformTenant) {
    if (!this.isSuperAdmin()) {
      return;
    }
    this.successText.set('');
    this.updateState({ mode: 'quota', id: tenant.tenant_id });
  }

  closeQuota() {
    this.updateState({ mode: 'list', id: null });
  }

  onQuotaSaved(code: string) {
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  openImpersonate(tenant: PlatformTenant) {
    if (!this.isSuperAdmin()) {
      return;
    }
    this.successText.set('');
    this.updateState({ mode: 'impersonate', id: tenant.tenant_id });
  }

  closeImpersonate() {
    this.updateState({ mode: 'list', id: null });
  }

  onImpersonationStarted(payload: { data: ImpersonationSessionData; ticket: string }) {
    this.updateState({ mode: 'list', id: null });
    this.impersonation.startSession(payload.data, payload.ticket);
    this.router.navigate(['/dashboard']);
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
    this.successText.set('');
  }
}
