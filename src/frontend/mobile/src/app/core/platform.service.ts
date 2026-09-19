import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, HealthSnapshot, PagedData, PlatformTenant, PlatformUser } from '@shared';

export interface TenantQuery {
  page?: number;
  size?: number;
  status?: string;
  keyword?: string;
}

export interface UserQuery {
  page?: number;
  size?: number;
  status?: string;
  keyword?: string;
  tenant_id?: string;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return entries.length ? `?${entries.join('&')}` : '';
}

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private api = inject(ApiService);

  getTenants(query: TenantQuery = {}): Observable<ApiResponse<PagedData<PlatformTenant>>> {
    return this.api.get<PagedData<PlatformTenant>>(`/api/v1/platform/tenants${toQueryString({ ...query })}`);
  }

  lockTenant(tenantId: string, data: { reason: string; confirm_password: string }): Observable<ApiResponse<PlatformTenant>> {
    return this.api.post<PlatformTenant>(`/api/v1/platform/tenants/${tenantId}/lock`, data);
  }

  unlockTenant(tenantId: string, confirmPassword: string): Observable<ApiResponse<PlatformTenant>> {
    return this.api.post<PlatformTenant>(`/api/v1/platform/tenants/${tenantId}/unlock`, {
      confirm_password: confirmPassword
    });
  }

  getUsers(query: UserQuery = {}): Observable<ApiResponse<PagedData<PlatformUser>>> {
    return this.api.get<PagedData<PlatformUser>>(`/api/v1/platform/users${toQueryString({ ...query })}`);
  }

  lockUser(userId: string): Observable<ApiResponse<PlatformUser>> {
    return this.api.post<PlatformUser>(`/api/v1/platform/users/${userId}/lock`, {});
  }

  unlockUser(userId: string): Observable<ApiResponse<PlatformUser>> {
    return this.api.post<PlatformUser>(`/api/v1/platform/users/${userId}/unlock`, {});
  }

  getHealth(): Observable<ApiResponse<HealthSnapshot>> {
    return this.api.get<HealthSnapshot>('/api/v1/platform/health');
  }
}
