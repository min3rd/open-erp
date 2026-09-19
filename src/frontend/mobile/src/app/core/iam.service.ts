import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  DataPolicy,
  DataResource,
  ListData,
  PagedData,
  Permission,
  ResponseKey,
  Role,
  SampleRecord,
  TenantUser,
  UserRoleItem
} from '@shared';

/**
 * Response shape of `GET /api/v1/iam/roles/{id}/permissions` (DES-02-API §5.3.1).
 * Kept tolerant (`permission_ids` vs `items`) so older backend builds do not break.
 */
export interface RolePermissionsData {
  permission_ids?: string[];
  items?: Permission[];
}

export interface TenantUserQuery {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IamService {
  private api = inject(ApiService);

  getRoles(): Observable<ApiResponse<ListData<Role>>> {
    return this.api.get<ListData<Role>>('/api/v1/iam/roles');
  }

  getPermissions(): Observable<ApiResponse<ListData<Permission>>> {
    return this.api.get<ListData<Permission>>('/api/v1/iam/permissions');
  }

  getRolePermissions(roleId: string): Observable<ApiResponse<RolePermissionsData>> {
    return this.api.get<RolePermissionsData>(`/api/v1/iam/roles/${roleId}/permissions`);
  }

  updateRolePermissions(roleId: string, permissionIds: string[]): Observable<ApiResponse<{ role_id: string; total_permissions_granted: number }>> {
    return this.api.put<{ role_id: string; total_permissions_granted: number }>(
      `/api/v1/iam/roles/${roleId}/permissions`,
      { permission_ids: permissionIds }
    );
  }

  getDataResources(): Observable<ApiResponse<ListData<DataResource>>> {
    return this.api.get<ListData<DataResource>>('/api/v1/iam/data-resources');
  }

  getRoleDataPolicies(roleId: string): Observable<ApiResponse<ListData<DataPolicy>>> {
    return this.api.get<ListData<DataPolicy>>(`/api/v1/iam/roles/${roleId}/data-policies`);
  }

  updateRoleDataPolicies(roleId: string, policies: DataPolicy[]): Observable<ApiResponse<{ role_id: string; updated_count: number }>> {
    return this.api.put<{ role_id: string; updated_count: number }>(
      `/api/v1/iam/roles/${roleId}/data-policies`,
      { policies }
    );
  }

  getUsers(query: TenantUserQuery = {}): Observable<ApiResponse<PagedData<TenantUser>>> {
    const params = new URLSearchParams();
    if (query.keyword) params.set('keyword', query.keyword);
    if (query.status) params.set('status', query.status);
    // Backend user directory (TASK-278) is 0-based; callers use 1-based page numbering.
    params.set('page', String(Math.max(0, (query.page ?? 1) - 1)));
    params.set('size', String(query.size ?? 20));
    return this.api.get<PagedData<TenantUser>>(`/api/v1/iam/users?${params.toString()}`).pipe(
      map((res) => ({
        ...res,
        data: {
          ...res.data,
          items: (res.data?.items || []).map((user) => ({
            ...user,
            id: user.id || user.user_id || ''
          }))
        }
      }))
    );
  }

  getUserRoles(userId: string): Observable<ApiResponse<ListData<UserRoleItem>>> {
    return this.api.get<ListData<UserRoleItem>>(`/api/v1/iam/users/${userId}/roles`);
  }

  assignUserRoles(userId: string, roleIds: string[]): Observable<ApiResponse<{ user_id: string; assigned_roles_count: number }>> {
    return this.api.post<{ user_id: string; assigned_roles_count: number }>(
      `/api/v1/iam/users/${userId}/roles`,
      { [ResponseKey.ROLE_IDS]: roleIds }
    );
  }

  removeUserRole(userId: string, roleId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/iam/users/${userId}/roles/${roleId}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SampleRecordService {
  private api = inject(ApiService);

  getRecords(page = 0, size = 20): Observable<ApiResponse<PagedData<SampleRecord>>> {
    return this.api.get<PagedData<SampleRecord>>(
      `/api/v1/core/sample-records?page=${page}&size=${size}`
    );
  }

  createRecord(data: { title: string; amount: number }): Observable<ApiResponse<SampleRecord>> {
    return this.api.post<SampleRecord>('/api/v1/core/sample-records', data);
  }
}
