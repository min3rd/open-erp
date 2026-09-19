import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  DataPolicy,
  DataResource,
  ListData,
  Permission,
  ResponseKey,
  Role,
  UserRoleItem
} from '@shared';

export interface RolePayload {
  code: string;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IamService {
  private api = inject(ApiService);

  getPermissions(): Observable<ApiResponse<ListData<Permission>>> {
    return this.api.get<ListData<Permission>>('/api/v1/iam/permissions');
  }

  getRoles(): Observable<ApiResponse<ListData<Role>>> {
    return this.api.get<ListData<Role>>('/api/v1/iam/roles');
  }

  createRole(payload: RolePayload): Observable<ApiResponse<Role>> {
    return this.api.post<Role>('/api/v1/iam/roles', {
      [ResponseKey.CODE]: payload.code,
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.DESCRIPTION]: payload.description || null
    });
  }

  updateRole(roleId: string, payload: RolePayload): Observable<ApiResponse<Role>> {
    return this.api.put<Role>(`/api/v1/iam/roles/${roleId}`, {
      [ResponseKey.CODE]: payload.code,
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.DESCRIPTION]: payload.description || null
    });
  }

  deleteRole(roleId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/iam/roles/${roleId}`);
  }

  getRolePermissions(roleId: string): Observable<ApiResponse<ListData<Permission>>> {
    return this.api.get<ListData<Permission>>(`/api/v1/iam/roles/${roleId}/permissions`);
  }

  updateRolePermissions(roleId: string, permissionIds: string[]): Observable<ApiResponse<{ role_id: string; total_permissions_granted: number }>> {
    return this.api.put<{ role_id: string; total_permissions_granted: number }>(`/api/v1/iam/roles/${roleId}/permissions`, {
      [ResponseKey.PERMISSION_IDS]: permissionIds
    });
  }

  getDataPolicies(roleId: string): Observable<ApiResponse<ListData<DataPolicy>>> {
    return this.api.get<ListData<DataPolicy>>(`/api/v1/iam/roles/${roleId}/data-policies`);
  }

  updateDataPolicies(roleId: string, policies: DataPolicy[]): Observable<ApiResponse<{ role_id: string; updated_count: number }>> {
    return this.api.put<{ role_id: string; updated_count: number }>(`/api/v1/iam/roles/${roleId}/data-policies`, {
      [ResponseKey.POLICIES]: policies
    });
  }

  getUserRoles(userId: string): Observable<ApiResponse<ListData<UserRoleItem>>> {
    return this.api.get<ListData<UserRoleItem>>(`/api/v1/iam/users/${userId}/roles`);
  }

  assignUserRoles(userId: string, roleIds: string[]): Observable<ApiResponse<{ user_id: string; assigned_roles_count: number }>> {
    return this.api.post<{ user_id: string; assigned_roles_count: number }>(`/api/v1/iam/users/${userId}/roles`, {
      [ResponseKey.ROLE_IDS]: roleIds
    });
  }

  removeUserRole(userId: string, roleId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/iam/users/${userId}/roles/${roleId}`);
  }

  getDataResources(): Observable<ApiResponse<ListData<DataResource>>> {
    return this.api.get<ListData<DataResource>>('/api/v1/iam/data-resources');
  }
}
