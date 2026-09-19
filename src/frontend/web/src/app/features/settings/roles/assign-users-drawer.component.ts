import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ApiErrorResponse,
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  I18nService,
  Role,
  SharpButtonComponent,
  SharpInputComponent,
  SharpToggleComponent,
  TenantUser,
  TranslatePipe,
  UserRoleItem,
  UserStatus
} from '@shared';

import { IamService } from '../../../core/services/iam.service';

@Component({
  selector: 'app-assign-users-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    DrawerComponent,
    SharpInputComponent,
    SharpToggleComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './assign-users-drawer.component.html'
})
export class AssignUsersDrawerComponent {
  private iam = inject(IamService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  role = input<Role | null>(null);
  roles = input<Role[]>([]);

  close = output<void>();
  saved = output<string>();

  readonly users = signal<TenantUser[]>([]);
  readonly userSearch = signal<string>('');
  readonly selectedUser = signal<TenantUser | null>(null);
  readonly userRoles = signal<UserRoleItem[]>([]);
  readonly checkedRoleIds = signal<Set<string>>(new Set<string>());
  readonly loadingUsers = signal<boolean>(false);
  readonly loadingMore = signal<boolean>(false);
  readonly loadingRoles = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly page = signal<number>(1);
  readonly totalPages = signal<number>(1);

  readonly badgeSuccess = ColorVariant.SUCCESS;
  readonly badgeWarning = ColorVariant.WARNING;
  readonly badgeDefault = ColorVariant.DEFAULT;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.userSearch.set('');
        this.selectedUser.set(null);
        this.userRoles.set([]);
        this.checkedRoleIds.set(new Set<string>());
        this.errorText.set('');
        this.loadUsers(true);
      }
    });
  }

  onSearchChange(value: string) {
    this.userSearch.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.loadUsers(true), 300);
  }

  loadMore() {
    if (this.page() < this.totalPages() && !this.loadingMore()) {
      this.loadUsers(false);
    }
  }

  hasMore(): boolean {
    return this.page() < this.totalPages();
  }

  statusVariant(status: string | null | undefined): ColorVariant {
    switch (status) {
      case UserStatus.ACTIVE:
        return ColorVariant.SUCCESS;
      case UserStatus.LOCKED:
        return ColorVariant.WARNING;
      case UserStatus.PENDING:
        return ColorVariant.INFO;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  statusLabelKey(status: string | null | undefined): string {
    return status ? `USER_STATUS_${status}` : 'COMMON_INACTIVE';
  }

  rolesForSaving(): { item: Role; checked: boolean }[] {
    const checked = this.checkedRoleIds();
    return this.roles().map((item) => ({ item, checked: checked.has(item.id) }));
  }

  selectUser(user: TenantUser) {
    if (!user?.id) {
      return;
    }
    this.selectedUser.set(user);
    this.loadingRoles.set(true);
    this.iam.getUserRoles(user.id).subscribe({
      next: (res) => {
        this.userRoles.set(res.data.items);
        const ids = new Set(res.data.items.map((item) => item.role_id));
        const contextRole = this.role();
        if (contextRole && this.roles().some((item) => item.id === contextRole.id)) {
          ids.add(contextRole.id);
        }
        this.checkedRoleIds.set(ids);
        this.loadingRoles.set(false);
      },
      error: (err) => {
        this.loadingRoles.set(false);
        this.showError(err);
      }
    });
  }

  toggleRole(roleId: string, checked: boolean) {
    const next = new Set(this.checkedRoleIds());
    if (checked) {
      next.add(roleId);
    } else {
      next.delete(roleId);
    }
    this.checkedRoleIds.set(next);
  }

  async save() {
    const user = this.selectedUser();
    if (!user) {
      this.errorText.set(this.i18n.t('IAM_ASSIGN_USERS_SELECT_USER'));
      return;
    }
    const currentIds = new Set(this.userRoles().map((item) => item.role_id));
    const checked = this.checkedRoleIds();
    const toAssign = Array.from(checked).filter((id) => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter((id) => !checked.has(id));

    this.saving.set(true);
    try {
      if (toAssign.length) {
        await firstValueFrom(this.iam.assignUserRoles(user.id, toAssign));
      }
      for (const roleId of toRemove) {
        await firstValueFrom(this.iam.removeUserRole(user.id, roleId));
      }
      this.saving.set(false);
      this.saved.emit('IAM_USER_ROLES_ASSIGNED');
    } catch (err) {
      this.saving.set(false);
      this.showError(err);
    }
  }

  onClose() {
    this.close.emit();
  }

  private loadUsers(reset: boolean) {
    if (reset) {
      this.loadingUsers.set(true);
    } else {
      this.loadingMore.set(true);
    }
    const nextPage = reset ? 1 : this.page() + 1;
    this.iam.getUsers({ keyword: this.userSearch().trim() || undefined, page: nextPage, size: 20 }).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.users.set(reset ? items : [...this.users(), ...items]);
        this.totalPages.set(res.data?.total_pages || 1);
        this.page.set(nextPage);
        this.loadingUsers.set(false);
        this.loadingMore.set(false);
      },
      error: (err) => {
        if (reset) {
          this.users.set([]);
        }
        this.loadingUsers.set(false);
        this.loadingMore.set(false);
        this.showError(err);
      }
    });
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
