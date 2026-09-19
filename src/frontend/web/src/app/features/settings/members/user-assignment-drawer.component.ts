import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  BadgeComponent,
  Branch,
  ColorVariant,
  DrawerComponent,
  FlatDepartmentNode,
  I18nService,
  Membership,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpToggleComponent,
  TenantUser,
  TranslatePipe,
  UserStatus
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
import { IamService } from '../../../core/services/iam.service';

@Component({
  selector: 'app-user-assignment-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    DrawerComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpToggleComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './user-assignment-drawer.component.html'
})
export class UserAssignmentDrawerComponent {
  private organization = inject(OrganizationService);
  private iam = inject(IamService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  membership = input<Membership | null>(null);
  branches = input<Branch[]>([]);
  departments = input<FlatDepartmentNode[]>([]);
  members = input<Membership[]>([]);

  close = output<void>();
  saved = output<string>();

  readonly userId = signal<string>('');
  readonly branchId = signal<string>('');
  readonly departmentId = signal<string>('');
  readonly managerUserId = signal<string>('');
  readonly title = signal<string>('');
  readonly isPrimary = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  readonly selectedUser = signal<TenantUser | null>(null);
  readonly userSearch = signal<string>('');
  readonly users = signal<TenantUser[]>([]);
  readonly loadingUsers = signal<boolean>(false);
  readonly loadingMore = signal<boolean>(false);
  readonly page = signal<number>(1);
  readonly totalPages = signal<number>(1);

  readonly badgeSuccess = ColorVariant.SUCCESS;
  readonly badgeWarning = ColorVariant.WARNING;
  readonly badgeInfo = ColorVariant.INFO;
  readonly badgeDefault = ColorVariant.DEFAULT;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly branchOptions = computed<SelectOption[]>(() =>
    this.branches().map((branch) => ({ value: branch.id, label: `${branch.code} - ${branch.name}` }))
  );

  readonly departmentOptions = computed<SelectOption[]>(() =>
    this.departments().map((department) => ({
      value: department.id,
      label: `${'-- '.repeat(department.depth)}${department.code} - ${department.name}`
    }))
  );

  readonly managerOptions = computed<SelectOption[]>(() => [
    { value: '', labelKey: 'ORGANIZATION_USER_ASSIGN_NO_MANAGER' },
    ...this.members().map((member) => ({
      value: member.user_id,
      label: `${member.user_full_name || member.user_email} (${member.user_email})`
    }))
  ]);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const editing = this.membership();
        this.userId.set(editing?.user_id || '');
        this.branchId.set(editing?.branch_id || '');
        this.departmentId.set(editing?.department_id || '');
        this.managerUserId.set(editing?.direct_manager_user_id || '');
        this.title.set(editing?.title || '');
        this.isPrimary.set(editing?.is_primary ?? true);
        this.errorText.set('');
        this.selectedUser.set(null);
        this.userSearch.set('');
        this.users.set([]);
        this.page.set(1);
        this.totalPages.set(1);
        if (!editing) {
          this.loadUsers(true);
        }
      }
    });
  }

  get isEditing(): boolean {
    return !!this.membership();
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

  selectUser(user: TenantUser) {
    this.selectedUser.set(user);
    this.userId.set(user.id);
  }

  clearSelectedUser() {
    this.selectedUser.set(null);
    this.userId.set('');
    this.loadUsers(true);
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

  onClose() {
    this.close.emit();
  }

  submit() {
    if (!this.userId().trim() || !this.branchId() || !this.departmentId()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    const payload = {
      user_id: this.userId().trim(),
      branch_id: this.branchId(),
      department_id: this.departmentId(),
      direct_manager_user_id: this.managerUserId() || null,
      title: this.title().trim() || undefined,
      is_primary: this.isPrimary()
    };
    const editing = this.membership();
    this.saving.set(true);
    const request = editing
      ? this.organization.updateMembership(editing.id, payload)
      : this.organization.createMembership(payload);
    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.saved.emit(res.code);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
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
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }
}
