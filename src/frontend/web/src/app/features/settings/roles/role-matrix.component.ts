import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApiErrorResponse,
  BadgeComponent,
  ColorVariant,
  DATA_OPERATIONS,
  DataOperation,
  DataPolicy,
  DataResource,
  DataScope,
  I18nService,
  Permission,
  Role,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpToggleComponent,
  TranslatePipe,
  dataScopeFieldKey,
  dataOperationLabelKey,
  dataScopeLabelKey
} from '@shared';

import { IamService } from '../../../core/services/iam.service';
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
    TranslatePipe,
    RoleFormDrawerComponent,
    AssignUsersDrawerComponent
  ],
  templateUrl: './role-matrix.component.html'
})
export class RoleMatrixComponent implements OnInit {
  private iam = inject(IamService);
  private i18n = inject(I18nService);

  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly resources = signal<DataResource[]>([]);
  readonly selectedRole = signal<Role | null>(null);
  readonly roleSearch = signal<string>('');
  readonly grantedIds = signal<Set<string>>(new Set<string>());
  readonly expandedDomains = signal<Set<string>>(new Set<string>());
  readonly policyMap = signal<Record<string, DataPolicy>>({});

  readonly loadingRoles = signal<boolean>(false);
  readonly loadingPermissions = signal<boolean>(false);
  readonly loadingPolicies = signal<boolean>(false);
  readonly savingPermissions = signal<boolean>(false);
  readonly savingPolicies = signal<boolean>(false);
  readonly rolePermissionsUnavailable = signal<boolean>(false);
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
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadingRoles.set(true);
    this.loadingPermissions.set(true);
    forkJoin({
      roles: this.iam.getRoles(),
      permissions: this.iam.getPermissions(),
      resources: this.iam.getDataResources()
    }).subscribe({
      next: ({ roles, permissions, resources }) => {
        this.roles.set(roles.data.items);
        this.permissions.set(permissions.data.items);
        this.resources.set(resources.data.items);
        this.expandedDomains.set(new Set(this.permissionGroups().map((group) => group.domain)));
        this.loadingRoles.set(false);
        this.loadingPermissions.set(false);
        if (roles.data.items.length) {
          this.selectRole(roles.data.items[0]);
        }
      },
      error: (err) => {
        this.loadingRoles.set(false);
        this.loadingPermissions.set(false);
        this.showError(err);
      }
    });
  }

  selectRole(role: Role) {
    this.selectedRole.set(role);
    this.successText.set('');
    this.loadRolePermissions(role);
    this.loadRolePolicies(role);
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
  }

  openEditRole(role: Role) {
    this.editingRole.set(role);
    this.roleFormOpen.set(true);
  }

  closeRoleForm() {
    this.roleFormOpen.set(false);
  }

  onRoleSaved(code: string) {
    this.roleFormOpen.set(false);
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.reloadRoles();
  }

  askDeleteRole(role: Role) {
    this.confirmDeleteRole.set(role);
  }

  cancelDeleteRole() {
    this.confirmDeleteRole.set(null);
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
    }
  }

  closeAssignUsers() {
    this.assignUsersOpen.set(false);
  }

  onUsersAssigned(code: string) {
    this.assignUsersOpen.set(false);
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.reloadRoles();
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
    this.rolePermissionsUnavailable.set(false);
    this.iam.getRolePermissions(role.id).subscribe({
      next: (res) => {
        this.grantedIds.set(new Set(res.data.items.map((permission) => permission.id)));
        this.loadingPermissions.set(false);
      },
      error: () => {
        this.grantedIds.set(new Set());
        this.loadingPermissions.set(false);
        this.rolePermissionsUnavailable.set(true);
      }
    });
  }

  private loadRolePolicies(role: Role) {
    this.loadingPolicies.set(true);
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
