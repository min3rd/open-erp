import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
import { IamService } from '../../../../core/iam.service';
import {
  ApiErrorResponse,
  BadgeComponent,
  BadgeVariant,
  ButtonVariant,
  DataPolicy,
  DataResource,
  DataScope,
  I18nService,
  Permission,
  Role,
  SharpButtonComponent,
  SharpInputComponent,
  SharpToggleComponent,
  TenantUser,
  TranslateDirective,
  TranslatePipe,
  UserStatus,
  apiMessage,
  dataScopeAbbreviationKey,
  dataScopeLabelKey
} from '@shared';

export type ScopeOperation =
  | 'create_scope'
  | 'read_scope'
  | 'update_scope'
  | 'delete_scope'
  | 'export_scope'
  | 'share_scope';

interface OperationDef {
  key: ScopeOperation;
  labelKey: string;
}

interface PermissionGroup {
  domain: string;
  items: Permission[];
}

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [
    CommonModule,
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
    SharpToggleComponent,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './role-detail.page.html'
})
export class RoleDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private iam = inject(IamService);
  private actionSheetCtrl = inject(ActionSheetController);
  private i18n = inject(I18nService);

  readonly badgeSystem = BadgeVariant.DEFAULT;
  readonly buttonPrimary = ButtonVariant.PRIMARY;

  readonly operations: OperationDef[] = [
    { key: 'read_scope', labelKey: 'IAM_OPERATION_READ' },
    { key: 'create_scope', labelKey: 'IAM_OPERATION_CREATE' },
    { key: 'update_scope', labelKey: 'IAM_OPERATION_UPDATE' },
    { key: 'delete_scope', labelKey: 'IAM_OPERATION_DELETE' },
    { key: 'export_scope', labelKey: 'IAM_OPERATION_EXPORT' },
    { key: 'share_scope', labelKey: 'IAM_OPERATION_SHARE' }
  ];

  readonly scopeOptions: DataScope[] = [
    DataScope.ALL,
    DataScope.BRANCH,
    DataScope.DEPARTMENT_AND_CHILDREN,
    DataScope.DEPARTMENT,
    DataScope.OWN_AND_SUBORDINATES,
    DataScope.OWN_ONLY,
    DataScope.NONE
  ];

  roleId = '';
  role = signal<Role | null>(null);
  activeTab = signal<'permissions' | 'scopes' | 'users'>('permissions');

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  permissions = signal<Permission[]>([]);
  grantedIds = signal<Set<string>>(new Set<string>());
  savingPermissions = signal<boolean>(false);

  resources = signal<DataResource[]>([]);
  policies = signal<Record<string, DataPolicy>>({});
  savingPolicies = signal<boolean>(false);

  users = signal<TenantUser[]>([]);
  userSearch = signal<string>('');
  usersPage = signal<number>(1);
  usersTotalPages = signal<number>(1);
  loadingUsers = signal<boolean>(false);
  loadingMoreUsers = signal<boolean>(false);
  selectedUser = signal<TenantUser | null>(null);
  userHasRole = signal<boolean>(false);
  loadingUserRoles = signal<boolean>(false);
  savingUserRole = signal<boolean>(false);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  permissionGroups = computed<PermissionGroup[]>(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of this.permissions()) {
      const list = groups.get(permission.domain) || [];
      list.push(permission);
      groups.set(permission.domain, list);
    }
    return Array.from(groups.entries()).map(([domain, items]) => ({ domain, items }));
  });

  ngOnInit() {
    this.roleId = this.route.snapshot.paramMap.get('roleId') || '';
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    forkJoin({
      roles: this.iam.getRoles(),
      permissions: this.iam.getPermissions(),
      rolePermissions: this.iam.getRolePermissions(this.roleId),
      resources: this.iam.getDataResources(),
      policies: this.iam.getRoleDataPolicies(this.roleId)
    }).subscribe({
      next: result => {
        this.role.set((result.roles.data?.items || []).find(item => item.id === this.roleId) || null);
        this.permissions.set(result.permissions.data?.items || []);
        this.grantedIds.set(new Set(this.extractGrantedPermissionIds(result.rolePermissions.data)));
        const resourceItems = result.resources.data?.items || [];
        this.resources.set(resourceItems);
        this.policies.set(this.buildPolicyMap(resourceItems, result.policies.data?.items || []));
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  setTab(tab: 'permissions' | 'scopes' | 'users') {
    this.activeTab.set(tab);
    if (tab === 'users' && !this.users().length && !this.loadingUsers()) {
      this.loadUsers(true);
    }
  }

  onUserSearchChange(value: string) {
    this.userSearch.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.loadUsers(true), 300);
  }

  loadMoreUsers() {
    if (this.usersPage() < this.usersTotalPages() && !this.loadingMoreUsers()) {
      this.loadUsers(false);
    }
  }

  hasMoreUsers(): boolean {
    return this.usersPage() < this.usersTotalPages();
  }

  userStatusVariant(status: string | null | undefined): BadgeVariant {
    switch (status) {
      case UserStatus.ACTIVE:
        return BadgeVariant.SUCCESS;
      case UserStatus.LOCKED:
        return BadgeVariant.WARNING;
      case UserStatus.PENDING:
        return BadgeVariant.INFO;
      default:
        return BadgeVariant.DEFAULT;
    }
  }

  userStatusLabelKey(status: string | null | undefined): string {
    return status ? `USER_STATUS_${status}` : 'COMMON_INACTIVE';
  }

  selectUser(user: TenantUser) {
    this.selectedUser.set(user);
    this.userHasRole.set(false);
    this.loadingUserRoles.set(true);
    this.error.set(null);
    this.success.set(null);
    this.iam.getUserRoles(user.id).subscribe({
      next: (res) => {
        this.userHasRole.set((res.data?.items || []).some((item) => item.role_id === this.roleId));
        this.loadingUserRoles.set(false);
      },
      error: (err) => {
        this.loadingUserRoles.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  saveUserRole() {
    const user = this.selectedUser();
    if (!user) {
      this.error.set(this.i18n.t('IAM_ASSIGN_USERS_SELECT_USER'));
      return;
    }
    this.savingUserRole.set(true);
    this.error.set(null);
    this.success.set(null);
    const handlers = {
      next: () => {
        this.savingUserRole.set(false);
        this.success.set(
          this.i18n.t(this.userHasRole() ? 'IAM_USER_ROLES_ASSIGNED' : 'IAM_USER_ROLE_REMOVED')
        );
      },
      error: (err: unknown) => {
        this.savingUserRole.set(false);
        this.error.set(apiMessage(this.i18n, err as ApiErrorResponse));
      }
    };
    if (this.userHasRole()) {
      this.iam.assignUserRoles(user.id, [this.roleId]).subscribe(handlers);
    } else {
      this.iam.removeUserRole(user.id, this.roleId).subscribe(handlers);
    }
  }

  private loadUsers(reset: boolean) {
    if (reset) {
      this.loadingUsers.set(true);
    } else {
      this.loadingMoreUsers.set(true);
    }
    const nextPage = reset ? 1 : this.usersPage() + 1;
    this.iam.getUsers({ keyword: this.userSearch().trim() || undefined, page: nextPage, size: 20 }).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.users.set(reset ? items : [...this.users(), ...items]);
        this.usersTotalPages.set(res.data?.total_pages || 1);
        this.usersPage.set(nextPage);
        this.loadingUsers.set(false);
        this.loadingMoreUsers.set(false);
      },
      error: (err) => {
        if (reset) {
          this.users.set([]);
        }
        this.loadingUsers.set(false);
        this.loadingMoreUsers.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  isGranted(permissionId: string): boolean {
    return this.grantedIds().has(permissionId);
  }

  permissionDescription(descriptionKey: string | undefined): string {
    if (!descriptionKey) {
      return '';
    }
    const translated = this.i18n.t(descriptionKey);
    return translated === descriptionKey ? '' : translated;
  }

  togglePermission(permissionId: string) {
    const next = new Set(this.grantedIds());
    if (next.has(permissionId)) {
      next.delete(permissionId);
    } else {
      next.add(permissionId);
    }
    this.grantedIds.set(next);
  }

  savePermissions() {
    this.savingPermissions.set(true);
    this.error.set(null);
    this.success.set(null);
    this.iam.updateRolePermissions(this.roleId, Array.from(this.grantedIds())).subscribe({
      next: () => {
        this.savingPermissions.set(false);
        this.success.set(this.i18n.t('IAM_ROLE_PERMISSIONS_UPDATED'));
      },
      error: err => {
        this.savingPermissions.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  scopeOf(resource: string, operation: ScopeOperation): DataScope {
    const policy = this.policies()[resource];
    if (!policy) {
      return DataScope.NONE;
    }
    return policy[operation] || DataScope.NONE;
  }

  scopeShortLabel(scope: DataScope): string {
    return this.i18n.t(dataScopeAbbreviationKey(scope));
  }

  scopeColorClass(scope: DataScope): string {
    switch (scope) {
      case DataScope.ALL:
        return 'text-purple-600 dark:text-purple-400 font-semibold';
      case DataScope.BRANCH:
        return 'text-blue-600 dark:text-blue-400';
      case DataScope.DEPARTMENT:
        return 'text-emerald-600 dark:text-emerald-400';
      case DataScope.DEPARTMENT_AND_CHILDREN:
        return 'text-cyan-600 dark:text-cyan-400';
      case DataScope.OWN_AND_SUBORDINATES:
        return 'text-amber-600 dark:text-amber-400';
      case DataScope.OWN_ONLY:
        return 'text-neutral-700 dark:text-neutral-300';
      case DataScope.NONE:
      default:
        return 'text-rose-500 font-medium';
    }
  }

  async openScopeSheet(resource: DataResource, operation: ScopeOperation) {
    const current = this.scopeOf(resource.resource, operation);
    const buttons: ActionSheetButton[] = this.scopeOptions.map(scope => ({
      text: `${this.i18n.t(dataScopeLabelKey(scope))} (${this.scopeShortLabel(scope)})`,
      cssClass: scope === current ? 'action-sheet-selected' : '',
      handler: () => {
        this.setScope(resource.resource, operation, scope);
        return true;
      }
    }));
    buttons.push({
      text: this.i18n.t('COMMON_CANCEL'),
      role: 'cancel'
    });

    const sheet = await this.actionSheetCtrl.create({
      header: `${resource.resource} — ${this.i18n.t(this.operationLabelKey(operation))}`,
      buttons
    });
    await sheet.present();
  }

  savePolicies() {
    this.savingPolicies.set(true);
    this.error.set(null);
    this.success.set(null);
    const payload = this.resources()
      .map(resource => this.policies()[resource.resource])
      .filter((policy): policy is DataPolicy => !!policy)
      .map(policy => ({
        resource: policy.resource,
        create_scope: policy.create_scope,
        read_scope: policy.read_scope,
        update_scope: policy.update_scope,
        delete_scope: policy.delete_scope,
        export_scope: policy.export_scope,
        share_scope: policy.share_scope
      }));
    this.iam.updateRoleDataPolicies(this.roleId, payload).subscribe({
      next: () => {
        this.savingPolicies.set(false);
        this.success.set(this.i18n.t('IAM_ROLE_DATA_POLICIES_UPDATED'));
      },
      error: err => {
        this.savingPolicies.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  private setScope(resource: string, operation: ScopeOperation, scope: DataScope) {
    const current = this.policies()[resource] || this.defaultPolicy(resource);
    this.policies.set({
      ...this.policies(),
      [resource]: { ...current, [operation]: scope }
    });
  }

  private operationLabelKey(operation: ScopeOperation): string {
    return this.operations.find(item => item.key === operation)?.labelKey || operation;
  }

  private extractGrantedPermissionIds(data: { permission_ids?: string[]; items?: Permission[] } | null | undefined): string[] {
    if (!data) {
      return [];
    }
    if (Array.isArray(data.permission_ids)) {
      return data.permission_ids;
    }
    // DES-02-API §5.3.1 keys items by `permission_id`; tolerate `id` as well.
    return (data.items || [])
      .map(permission => permission.permission_id || permission.id || '')
      .filter(id => !!id);
  }

  private buildPolicyMap(resources: DataResource[], existing: DataPolicy[]): Record<string, DataPolicy> {
    const map: Record<string, DataPolicy> = {};
    for (const resource of resources) {
      const found = existing.find(policy => policy.resource === resource.resource);
      map[resource.resource] = found || this.defaultPolicy(resource.resource);
    }
    return map;
  }

  private defaultPolicy(resource: string): DataPolicy {
    return {
      role_id: this.roleId,
      resource,
      create_scope: DataScope.NONE,
      read_scope: DataScope.NONE,
      update_scope: DataScope.NONE,
      delete_scope: DataScope.NONE,
      export_scope: DataScope.NONE,
      share_scope: DataScope.NONE
    };
  }
}
