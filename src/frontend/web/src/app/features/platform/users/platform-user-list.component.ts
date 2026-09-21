import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  BadgeComponent,
  ColorVariant,
  I18nService,
  PaginationComponent,
  PlatformUser,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TableColumn,
  TableComponent,
  TranslatePipe,
  UserStatus,
  formatDateTime
} from '@shared';

import { PlatformService } from '../../../core/services/platform.service';
import { AuthService } from '../../../core/services/auth.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';
import { BreakGlassDrawerComponent } from './break-glass-drawer.component';

@Component({
  selector: 'app-platform-user-list',
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
    BreakGlassDrawerComponent
  ],
  providers: [PathListStateService],
  templateUrl: './platform-user-list.component.html'
})
export class PlatformUserListComponent implements OnInit {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);
  private listState = inject(PathListStateService);

  /** SUPPORT_ENGINEER is read-only (backend rejects all non-GET platform calls). */
  readonly isSuperAdmin = this.auth.isPlatformSuperAdmin;

  readonly users = signal<PlatformUser[]>([]);
  readonly loading = signal<boolean>(false);
  readonly userStatusLocked = UserStatus.LOCKED;
  readonly formatDateTime = formatDateTime;
  readonly page = signal<number>(0);
  readonly size = signal<number>(20);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly statusFilter = signal<string>('');
  readonly keyword = signal<string>('');
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  readonly confirmUser = signal<PlatformUser | null>(null);
  readonly confirmAction = signal<'LOCK' | 'UNLOCK' | null>(null);
  readonly confirmSaving = signal<boolean>(false);

  readonly breakGlassUser = signal<PlatformUser | null>(null);
  readonly breakGlassOpen = signal<boolean>(false);

  private loadedListKey = '';
  private currentState: PathListState | null = null;

  readonly columns: TableColumn[] = [
    { key: 'email', labelKey: 'PLATFORM_USER_COL_EMAIL' },
    { key: 'status', labelKey: 'PLATFORM_USER_COL_STATUS' },
    { key: 'tenant', labelKey: 'PLATFORM_USER_COL_TENANT' },
    { key: 'last_login_at', labelKey: 'PLATFORM_USER_COL_LAST_LOGIN' },
    { key: '2fa', labelKey: 'PLATFORM_USER_COL_2FA', align: 'center' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  readonly statusOptions: SelectOption[] = [
    { value: '', labelKey: 'COMMON_ALL' },
    { value: UserStatus.ACTIVE, labelKey: 'COMMON_ACTIVE' },
    { value: UserStatus.LOCKED, labelKey: 'PLATFORM_USER_STATUS_LOCKED' },
    { value: UserStatus.PENDING, labelKey: 'PLATFORM_USER_STATUS_PENDING' },
    { value: UserStatus.DISABLED, labelKey: 'COMMON_INACTIVE' }
  ];

  ngOnInit() {
    this.listState.bind('/platform/users', (state, keyword) => this.applyState(state, keyword));
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
    const user = state.id ? this.users().find((item) => item.user_id === state.id) ?? null : null;
    const canManage = this.isSuperAdmin();

    this.breakGlassUser.set(state.mode === 'breakglass' ? user : null);
    this.breakGlassOpen.set(state.mode === 'breakglass' && !!user && canManage);

    if (canManage && user && (state.mode === 'lock' || state.mode === 'unlock')) {
      this.confirmUser.set(user);
      this.confirmAction.set(state.mode === 'lock' ? 'LOCK' : 'UNLOCK');
    } else {
      this.confirmUser.set(null);
      this.confirmAction.set(null);
    }
  }

  private updateState(patch: Partial<PathListState>, keyword?: string | null): void {
    this.listState.set(patch, keyword);
  }

  load() {
    this.loading.set(true);
    this.platform
      .getUsers({
        page: this.page(),
        size: this.size(),
        status: (this.statusFilter() as UserStatus) || '',
        keyword: this.keyword()
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data.items);
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

  statusVariant(status: UserStatus): ColorVariant {
    switch (status) {
      case UserStatus.ACTIVE:
        return ColorVariant.SUCCESS;
      case UserStatus.LOCKED:
        return ColorVariant.DANGER;
      case UserStatus.PENDING:
        return ColorVariant.WARNING;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  askLock(user: PlatformUser) {
    if (!this.isSuperAdmin()) {
      return;
    }
    this.successText.set('');
    this.updateState({ mode: 'lock', id: user.user_id });
  }

  askUnlock(user: PlatformUser) {
    if (!this.isSuperAdmin()) {
      return;
    }
    this.successText.set('');
    this.updateState({ mode: 'unlock', id: user.user_id });
  }

  cancelConfirm() {
    this.updateState({ mode: 'list', id: null });
  }

  submitConfirm() {
    const user = this.confirmUser();
    const action = this.confirmAction();
    if (!user || !action) {
      return;
    }
    this.confirmSaving.set(true);
    const request = action === 'LOCK' ? this.platform.lockUser(user.user_id) : this.platform.unlockUser(user.user_id);
    request.subscribe({
      next: (res) => {
        this.confirmSaving.set(false);
        this.cancelConfirm();
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

  openBreakGlass(user: PlatformUser) {
    if (!this.isSuperAdmin()) {
      return;
    }
    this.successText.set('');
    this.updateState({ mode: 'breakglass', id: user.user_id });
  }

  closeBreakGlass() {
    this.updateState({ mode: 'list', id: null });
  }

  onBreakGlassCompleted(code: string) {
    this.updateState({ mode: 'list', id: null });
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
