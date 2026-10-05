import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  BadgeComponent,
  ColorVariant,
  ContextMenuItem,
  ContextMenuTriggerDirective,
  DATA_OPERATIONS,
  DataOperation,
  DataPolicy,
  DataResource,
  DataScope,
  I18nService,
  IconName,
  Permission,
  RequirePermissionDirective,
  Role,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpToggleComponent,
  SkeletonTableComponent,
  TranslatePipe,
  dataScopeFieldKey,
  dataOperationLabelKey,
  dataScopeLabelKey
} from '@shared';

import { AuthService } from '../../../core/services/auth.service';
import { IamService } from '../../../core/services/iam.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';
import { RoleFormDrawerComponent } from './role-form-drawer.component';
import { AssignUsersDrawerComponent } from './assign-users-drawer.component';

interface PermissionGroup {
  domain: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-matrix',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpToggleComponent,
    SkeletonTableComponent,
    TranslatePipe,
    RoleFormDrawerComponent,
    AssignUsersDrawerComponent,
    RequirePermissionDirective,
    ContextMenuTriggerDirective
  ],
  providers: [PathListStateService],
  templateUrl: './role-matrix.component.html'
})
export class RoleMatrixComponent implements OnInit {
  private iam = inject(IamService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);
  private listState = inject(PathListStateService);

  private pendingState: PathListState | null = null;

  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly resources = signal<DataResource[]>([]);
  readonly selectedRole = signal<Role | null>(null);
  readonly roleSearch = signal<string>('');
  readonly grantedIds = signal<Set<string>>(new Set<string>());
  readonly expandedDomains = signal<Set<string>>(new Set<string>());
  readonly policyMap = signal<Record<string, DataPolicy>>({});

  readonly loadingRoles = signal<boolean>(false);
  readonly rolesError = signal<boolean>(false);
  readonly loadingCatalog = signal<boolean>(false);
  readonly catalogError = signal<boolean>(false);
  readonly loadingResources = signal<boolean>(false);
  readonly resourcesError = signal<boolean>(false);
  readonly loadingPermissions = signal<boolean>(false);
  readonly permissionsError = signal<boolean>(false);
  readonly loadingPolicies = signal<boolean>(false);
  readonly policiesError = signal<boolean>(false);
  readonly savingPermissions = signal<boolean>(false);
  readonly savingPolicies = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  readonly roleFormOpen = signal<boolean>(false);
  readonly editingRole = signal<Role | null>(null);
  readonly assignUsersOpen = signal<boolean>(false);
  readonly confirmDeleteRole = signal<Role | null>(null);
  readonly deletingRole = signal<boolean>(false);

  readonly operations = DATA_OPERATIONS;
  readonly badgeVariantDefault = ColorVariant.DEFAULT;
  readonly badgeVariantSuccess = ColorVariant.SUCCESS;

  readonly scopeOptions: SelectOption[] = [
    { value: DataScope.ALL, labelKey: 'IAM_DATA_SCOPE_ALL' },
    { value: DataScope.BRANCH, labelKey: 'IAM_DATA_SCOPE_BRANCH' },
    { value: DataScope.DEPARTMENT_AND_CHILDREN, labelKey: 'IAM_DATA_SCOPE_DEPT_CHILDREN' },
    { value: DataScope.DEPARTMENT, labelKey: 'IAM_DATA_SCOPE_DEPT' },
    { value: DataScope.OWN_AND_SUBORDINATES, labelKey: 'IAM_DATA_SCOPE_SUBORDINATES' },
    { value: DataScope.OWN_ONLY, labelKey: 'IAM_DATA_SCOPE_OWN' },
    { value: DataScope.NONE, labelKey: 'IAM_DATA_SCOPE_NONE' }
  ];

  readonly filteredRoles = computed(() => {
    const term = this.roleSearch().trim().toLowerCase();
    if (!term) {
      return this.roles();
    }
    return this.roles().filter(
      (role) => role.name.toLowerCase().includes(term) || role.code.toLowerCase().includes(term)
    );
  });

  readonly permissionGroups = computed<PermissionGroup[]>(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of this.permissions()) {
      const list = groups.get(permission.domain) || [];
      list.push(permission);
      groups.set(permission.domain, list);
    }
    return Array.from(groups.entries()).map(([domain, items]) => ({ domain, permissions: items }));
  });

  ngOnInit() {
    this.listState.bind('/settings/roles', (state) => this.applyRouteState(state));
    this.loadInitialData();
  }

  /** Deep-link / F5: restore the selected role and any open drawer from the route. */
  private applyRouteState(state: PathListState) {
    this.pendingState = state;
    if (!this.roles().length) {
      return;
    }
    const role = state.id ? this.roles().find((item) => item.id === state.id) : undefined;
    if (role && role.id !== this.selectedRole()?.id) {
      this.selectRole(role, false);
    }
    this.applyDrawerMode(state.mode);
  }

  /** `mode` drives the route-addressable drawers: list | create | edit | delete | assign. */
  private applyDrawerMode(mode: string) {
    this.roleFormOpen.set(false);
    this.assignUsersOpen.set(false);
    this.confirmDeleteRole.set(null);
    switch (mode) {
      case 'create':
        this.editingRole.set(null);
        this.roleFormOpen.set(true);
        break;
      case 'edit':
        if (this.selectedRole()) {
          this.editingRole.set(this.selectedRole());
          this.roleFormOpen.set(true);
        }
        break;
      case 'delete':
        if (this.selectedRole()) {
          this.confirmDeleteRole.set(this.selectedRole());
        }
        break;
      case 'assign':
        if (this.selectedRole()) {
          this.assignUsersOpen.set(true);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Each region loads on its own so a slow/failed region never blocks the
   * others (Sprint 04, TASK-367 / AC-12): roles list, permission catalogue,
   * data-resource catalogue, and the selected role's grants/policies.
   */
  loadInitialData() {
    this.loadRoles();
    this.loadPermissionCatalog();
    this.loadResources();
  }

  loadRoles() {
    this.loadingRoles.set(true);
    this.rolesError.set(false);
    this.iam.getRoles().subscribe({
      next: (res) => {
        this.roles.set(res.data.items);
        this.loadingRoles.set(false);
        if (res.data.items.length) {
          const wanted = this.pendingState?.id
            ? res.data.items.find((item) => item.id === this.pendingState?.id)
            : undefined;
          this.selectRole(wanted ?? res.data.items[0], false);
          this.applyDrawerMode(this.pendingState?.mode ?? 'list');
        }
      },
      error: (err) => {
        this.loadingRoles.set(false);
        this.rolesError.set(true);
        this.showError(err);
      }
    });
  }

  loadPermissionCatalog() {
    this.loadingCatalog.set(true);
    this.catalogError.set(false);
    this.iam.getPermissions().subscribe({
      next: (res) => {
        this.permissions.set(res.data.items);
        this.expandedDomains.set(new Set(this.permissionGroups().map((group) => group.domain)));
        this.loadingCatalog.set(false);
      },
      error: (err) => {
        this.loadingCatalog.set(false);
        this.catalogError.set(true);
        this.showError(err);
      }
    });
  }

  /** The data-resource catalogue only feeds the scope matrix; it must not block permissions. */
  loadResources() {
    this.loadingResources.set(true);
    this.resourcesError.set(false);
    this.iam.getDataResources().subscribe({
      next: (res) => {
        this.resources.set(res.data.items);
        this.loadingResources.set(false);
      },
      error: (err) => {
        this.loadingResources.set(false);
        this.resourcesError.set(true);
        this.showError(err);
      }
    });
  }

  /** Retry only the failed half of the permissions column. */
  retryPermissions() {
    if (this.catalogError()) {
      this.loadPermissionCatalog();
    }
    const role = this.selectedRole();
    if (this.permissionsError() && role) {
      this.loadRolePermissions(role);
    }
  }

  /** Retry only the failed half of the data-scopes column. */
  retryDataScopes() {
    if (this.resourcesError()) {
      this.loadResources();
    }
    const role = this.selectedRole();
    if (this.policiesError() && role) {
      this.loadRolePolicies(role);
    }
  }

  selectRole(role: Role, syncUrl = true) {
    this.selectedRole.set(role);
    this.successText.set('');
    this.loadRolePermissions(role);
    this.loadRolePolicies(role);
    if (syncUrl) {
      this.listState.set({ id: role.id, mode: 'list' });
    }
  }

  isDomainExpanded(domain: string): boolean {
    return this.expandedDomains().has(domain);
  }

  toggleDomain(domain: string) {
    const next = new Set(this.expandedDomains());
    if (next.has(domain)) {
      next.delete(domain);
    } else {
      next.add(domain);
    }
    this.expandedDomains.set(next);
  }

  hasPermission(permissionId: string): boolean {
    return this.grantedIds().has(permissionId);
  }

  togglePermission(permissionId: string, checked: boolean) {
    const next = new Set(this.grantedIds());
    if (checked) {
      next.add(permissionId);
    } else {
      next.delete(permissionId);
    }
    this.grantedIds.set(next);
  }

  grantedCount(): number {
    return this.grantedIds().size;
  }

  savePermissions() {
    const role = this.selectedRole();
    if (!role) {
      return;
    }
    this.savingPermissions.set(true);
    this.iam.updateRolePermissions(role.id, Array.from(this.grantedIds())).subscribe({
      next: (res) => {
        this.savingPermissions.set(false);
        this.successText.set(this.i18n.t(res.code, res.params));
        this.errorText.set('');
      },
      error: (err) => {
        this.savingPermissions.set(false);
        this.showError(err);
      }
    });
  }

  getScope(resource: string, operation: DataOperation): DataScope {
    const policy = this.policyMap()[resource];
    if (!policy) {
      return DataScope.NONE;
    }
    const field = dataScopeFieldKey(operation) as keyof DataPolicy;
    return (policy[field] as DataScope) || DataScope.NONE;
  }

  setScope(resource: string, operation: DataOperation, scope: string) {
    const next = { ...this.policyMap() };
    const existing = next[resource] || this.emptyPolicy(resource);
    next[resource] = { ...existing, [dataScopeFieldKey(operation)]: scope as DataScope };
    this.policyMap.set(next);
  }

  scopeLabelKey(scope: DataScope): string {
    return dataScopeLabelKey(scope);
  }

  operationLabelKey(operation: DataOperation): string {
    return dataOperationLabelKey(operation);
  }

  savePolicies() {
    const role = this.selectedRole();
    if (!role) {
      return;
    }
    const policies = this.resources().map((resource) => this.policyMap()[resource.resource] || this.emptyPolicy(resource.resource));
    this.savingPolicies.set(true);
    this.iam.updateDataPolicies(role.id, policies).subscribe({
      next: (res) => {
        this.savingPolicies.set(false);
        this.successText.set(this.i18n.t(res.code, res.params));
        this.errorText.set('');
      },
      error: (err) => {
        this.savingPolicies.set(false);
        this.showError(err);
      }
    });
  }

  openCreateRole() {
    this.editingRole.set(null);
    this.roleFormOpen.set(true);
    this.listState.set({ id: null, mode: 'create' });
  }

  openEditRole(role: Role) {
    this.selectRole(role, false);
    this.editingRole.set(role);
    this.roleFormOpen.set(true);
    this.listState.set({ id: role.id, mode: 'edit' });
  }

  closeRoleForm() {
    this.roleFormOpen.set(false);
    this.listState.set({ mode: 'list' });
  }

  onRoleSaved(code: string) {
    this.roleFormOpen.set(false);
    this.listState.set({ mode: 'list' });
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.reloadRoles();
  }

  askDeleteRole(role: Role) {
    this.selectRole(role, false);
    this.confirmDeleteRole.set(role);
    this.listState.set({ id: role.id, mode: 'delete' });
  }

  cancelDeleteRole() {
    this.confirmDeleteRole.set(null);
    this.listState.set({ mode: 'list' });
  }

  confirmDelete() {
    const role = this.confirmDeleteRole();
    if (!role) {
      return;
    }
    this.deletingRole.set(true);
    this.iam.deleteRole(role.id).subscribe({
      next: (res) => {
        this.deletingRole.set(false);
        this.confirmDeleteRole.set(null);
        this.listState.set({ id: null, mode: 'list' });
        this.successText.set(this.i18n.t(res.code, res.params));
        this.errorText.set('');
        if (this.selectedRole()?.id === role.id) {
          this.selectedRole.set(null);
        }
        this.reloadRoles();
      },
      error: (err) => {
        this.deletingRole.set(false);
        this.showError(err);
      }
    });
  }

  openAssignUsers() {
    if (this.selectedRole()) {
      this.assignUsersOpen.set(true);
      this.listState.set({ id: this.selectedRole()?.id ?? null, mode: 'assign' });
    }
  }

  closeAssignUsers() {
    this.assignUsersOpen.set(false);
    this.listState.set({ mode: 'list' });
  }

  onUsersAssigned(code: string) {
    this.assignUsersOpen.set(false);
    this.listState.set({ mode: 'list' });
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.reloadRoles();
  }

  /** Right-click shortcut for a role row; each action reuses the inline handler. */
  contextMenuItems(role: Role): ContextMenuItem[] {
    const canManage = this.auth.hasPermission('core:role:manage') !== false;
    const items: ContextMenuItem[] = [
      {
        id: 'edit',
        labelKey: 'COMMON_EDIT',
        icon: IconName.EDIT,
        disabled: !canManage,
        disabledReasonKey: canManage ? undefined : 'COMMON_PERMISSION_REQUIRED',
        action: () => this.openEditRole(role)
      },
      {
        id: 'assign',
        labelKey: 'IAM_ASSIGN_USERS_BTN',
        icon: IconName.USER,
        action: () => {
          this.selectRole(role, false);
          this.openAssignUsers();
        }
      }
    ];
    if (!role.is_system) {
      items.push({
        id: 'delete',
        labelKey: 'COMMON_DELETE',
        icon: IconName.TRASH,
        danger: true,
        disabled: !canManage,
        disabledReasonKey: canManage ? undefined : 'COMMON_PERMISSION_REQUIRED',
        action: () => this.askDeleteRole(role)
      });
    }
    return items;
  }

  private reloadRoles() {
    this.iam.getRoles().subscribe({
      next: (res) => {
        this.roles.set(res.data.items);
        const current = this.selectedRole();
        if (current) {
          const refreshed = res.data.items.find((role) => role.id === current.id);
          this.selectedRole.set(refreshed || null);
        }
      },
      error: (err) => this.showError(err)
    });
  }

  private loadRolePermissions(role: Role) {
    this.loadingPermissions.set(true);
    this.permissionsError.set(false);
    this.iam.getRolePermissions(role.id).subscribe({
      next: (res) => {
        this.grantedIds.set(new Set(res.data.items.map((permission) => permission.id)));
        this.loadingPermissions.set(false);
      },
      error: (err) => {
        this.grantedIds.set(new Set());
        this.loadingPermissions.set(false);
        this.permissionsError.set(true);
        this.showError(err);
      }
    });
  }

  private loadRolePolicies(role: Role) {
    this.loadingPolicies.set(true);
    this.policiesError.set(false);
    this.iam.getDataPolicies(role.id).subscribe({
      next: (res) => {
        const map: Record<string, DataPolicy> = {};
        for (const policy of res.data.items) {
          map[policy.resource] = policy;
        }
        this.policyMap.set(map);
        this.loadingPolicies.set(false);
      },
      error: () => {
        this.policyMap.set({});
        this.loadingPolicies.set(false);
        this.policiesError.set(true);
      }
    });
  }

  private emptyPolicy(resource: string): DataPolicy {
    return {
      resource,
      create_scope: DataScope.NONE,
      read_scope: DataScope.NONE,
      update_scope: DataScope.NONE,
      delete_scope: DataScope.NONE,
      export_scope: DataScope.NONE,
      share_scope: DataScope.NONE
    };
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
    this.successText.set('');
  }
}
