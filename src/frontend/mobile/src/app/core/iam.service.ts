import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  DataPolicy,
  DataResource,
  ListData,
  PagedData,
  Permission,
  Role,
  SampleRecord
} from '@shared';

/**
 * Response shape of `GET /api/v1/iam/roles/{id}/permissions`.
 * TODO(shared-sync): DES-02-API §5.3 documents only the PUT endpoint; keep this
 * tolerant parser until the Backend contract confirms `permission_ids` vs `items`.
 */
export interface RolePermissionsData {
  permission_ids?: string[];
  items?: Permission[];
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
