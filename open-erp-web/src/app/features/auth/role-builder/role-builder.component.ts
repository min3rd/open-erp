import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { InputComponent, ButtonComponent, IconComponent, AlertComponent, HasPermissionDirective } from '@open-erp/shared';

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    InputComponent,
    ButtonComponent,
    IconComponent,
    AlertComponent,
    HasPermissionDirective
  ],
  templateUrl: './role-builder.component.html',
})
export class RoleBuilderComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private transloco = inject(TranslocoService);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  selectedRoleId = signal<string>('');
  
  roleForm!: FormGroup;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Selected role object
  selectedRole = computed(() => {
    return this.roles().find((r) => r.id === this.selectedRoleId());
  });

  // Group permissions by module
  groupedPermissions = computed(() => {
    const groups: { [key: string]: Permission[] } = {};
    for (const perm of this.permissions()) {
      if (!groups[perm.module]) {
        groups[perm.module] = [];
      }
      groups[perm.module].push(perm);
    }
    return Object.entries(groups).map(([module, list]) => ({ module, list }));
  });

  ngOnInit() {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
    });

    this.loadPermissions();
    this.loadRoles();
  }

  getControl(name: string): FormControl {
    return this.roleForm.get(name) as FormControl;
  }

  loadPermissions() {
    this.http.get<{ success: boolean; data: Permission[] }>('/api/v1/auth/permissions').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.permissions.set(res.data);
        }
      },
    });
  }

  loadRoles() {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: Role[] }>('/api/v1/auth/roles').subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.roles.set(res.data);
          if (res.data.length > 0 && !this.selectedRoleId()) {
            this.selectedRoleId.set(res.data[0].id);
          }
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectRole(roleId: string) {
    this.selectedRoleId.set(roleId);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  isPermissionChecked(permissionCode: string): boolean {
    const role = this.selectedRole();
    if (!role || !role.permissions) return false;
    return role.permissions.some((p) => p.code === permissionCode);
  }

  togglePermission(permissionCode: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const role = this.selectedRole();
    if (!role) return;

    let updatedCodes = role.permissions.map((p) => p.code);
    if (checkbox.checked) {
      if (!updatedCodes.includes(permissionCode)) {
        updatedCodes.push(permissionCode);
      }
    } else {
      updatedCodes = updatedCodes.filter((c) => c !== permissionCode);
    }

    this.http.put<{ success: boolean; data: Role }>(`/api/v1/auth/roles/${role.id}/permissions`, {
      permissionCodes: updatedCodes,
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Update roles signal
          this.roles.update((list) =>
            list.map((r) => (r.id === role.id ? res.data : r))
          );
          this.successMessage.set(this.transloco.translate('roles.update_permissions_success'));
        }
      },
      error: () => {
        this.errorMessage.set(this.transloco.translate('roles.update_permissions_error'));
      },
    });
  }

  createRole() {
    if (this.roleForm.invalid) return;

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.http.post<{ success: boolean; data: Role }>('/api/v1/auth/roles', this.roleForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.roles.update((list) => [...list, res.data]);
          this.selectedRoleId.set(res.data.id);
          this.roleForm.reset();
          this.successMessage.set(this.transloco.translate('roles.create_success'));
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(this.transloco.translate('roles.create_error'));
      },
    });
  }

  deleteRole(roleId: string) {
    if (!confirm(this.transloco.translate('roles.delete_confirm'))) return;

    this.http.delete(`/api/v1/auth/roles/${roleId}`).subscribe({
      next: () => {
        this.roles.update((list) => list.filter((r) => r.id !== roleId));
        if (this.roles().length > 0) {
          this.selectedRoleId.set(this.roles()[0].id);
        } else {
          this.selectedRoleId.set('');
        }
        this.successMessage.set(this.transloco.translate('roles.delete_success'));
      },
      error: () => {
        this.errorMessage.set(this.transloco.translate('roles.delete_error'));
      },
    });
  }
}
