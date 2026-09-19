import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { buildQuery } from '../utils/query.util';
import {
  ApiResponse,
  AuditLog,
  HealthSnapshot,
  ImpersonationLog,
  ImpersonationSessionData,
  ListData,
  PagedData,
  PlatformAdmin,
  PlatformAdminRole,
  PlatformPlugin,
  PlatformTenant,
  PlatformUser,
  ResponseKey,
  TenantQuotaPayload,
  TenantStatus,
  TenantStatusPayload,
  UserStatus
} from '@shared';

export interface TenantQuery {
  page?: number;
  size?: number;
  status?: TenantStatus | '';
  keyword?: string;
}

export interface PlatformUserQuery {
  page?: number;
  size?: number;
  status?: UserStatus | '';
  keyword?: string;
  tenant_id?: string;
}

export interface AuditLogQuery {
  page?: number;
  size?: number;
  action?: string;
  tenant_id?: string;
  from_date?: string;
  to_date?: string;
  scope?: string;
  result?: string;
  actor_user_id?: string;
  resource_type?: string;
  keyword?: string;
}

export interface ImpersonationLogQuery {
  page?: number;
  size?: number;
  super_admin_user_id?: string;
  tenant_id?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}

export interface GrantAdminPayload {
  email: string;
  role: PlatformAdminRole;
  full_name: string;
}

export interface AdminLifecyclePayload {
  reason: string;
  confirm_password: string;
}

export interface BreakGlass2FaPayload {
  support_ticket: string;
  reason: string;
  confirm_password: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private api = inject(ApiService);

  getTenants(query: TenantQuery): Observable<ApiResponse<PagedData<PlatformTenant>>> {
    return this.api.get<PagedData<PlatformTenant>>(`/api/v1/platform/tenants${buildQuery(query as Record<string, any>)}`);
  }

  getTenant(tenantId: string): Observable<ApiResponse<PlatformTenant>> {
    return this.api.get<PlatformTenant>(`/api/v1/platform/tenants/${tenantId}`);
  }

  updateTenantQuotas(tenantId: string, payload: TenantQuotaPayload): Observable<ApiResponse<PlatformTenant>> {
    return this.api.patch<PlatformTenant>(`/api/v1/platform/tenants/${tenantId}/quotas`, {
      [ResponseKey.PLAN_TIER]: payload.plan_tier,
      [ResponseKey.MAX_USERS]: payload.max_users,
      [ResponseKey.MAX_STORAGE_MB]: payload.max_storage_mb,
      [ResponseKey.ALLOWED_PLUGINS]: payload.allowed_plugins
    });
  }

  getPlugins(): Observable<ApiResponse<ListData<PlatformPlugin>>> {
    return this.api.get<ListData<PlatformPlugin>>('/api/v1/platform/plugins');
  }

  lockTenant(tenantId: string, reason: string, confirmPassword: string): Observable<ApiResponse<TenantStatusPayload>> {
    return this.api.post<TenantStatusPayload>(`/api/v1/platform/tenants/${tenantId}/lock`, {
      [ResponseKey.REASON]: reason,
      [ResponseKey.CONFIRM_PASSWORD]: confirmPassword
    });
  }

  unlockTenant(tenantId: string, confirmPassword: string): Observable<ApiResponse<TenantStatusPayload>> {
    return this.api.post<TenantStatusPayload>(`/api/v1/platform/tenants/${tenantId}/unlock`, {
      [ResponseKey.CONFIRM_PASSWORD]: confirmPassword
    });
  }

  impersonate(tenantId: string, payload: {
    target_user_id?: string;
    support_ticket: string;
    reason: string;
    confirm_password: string;
  }): Observable<ApiResponse<ImpersonationSessionData>> {
    return this.api.post<ImpersonationSessionData>(`/api/v1/platform/tenants/${tenantId}/impersonate`, {
      [ResponseKey.TARGET_USER_ID]: payload.target_user_id || undefined,
      [ResponseKey.SUPPORT_TICKET]: payload.support_ticket,
      [ResponseKey.REASON]: payload.reason,
      [ResponseKey.CONFIRM_PASSWORD]: payload.confirm_password
    });
  }

  exitImpersonation(): Observable<ApiResponse<null>> {
    return this.api.post<null>('/api/v1/platform/impersonate/exit', {});
  }

  getUsers(query: PlatformUserQuery): Observable<ApiResponse<PagedData<PlatformUser>>> {
    return this.api.get<PagedData<PlatformUser>>(`/api/v1/platform/users${buildQuery(query as Record<string, any>)}`);
  }

  lockUser(userId: string): Observable<ApiResponse<PlatformUser>> {
    return this.api.post<PlatformUser>(`/api/v1/platform/users/${userId}/lock`, {});
  }

  unlockUser(userId: string): Observable<ApiResponse<PlatformUser>> {
    return this.api.post<PlatformUser>(`/api/v1/platform/users/${userId}/unlock`, {});
  }

  forcePasswordReset(userId: string): Observable<ApiResponse<PlatformUser>> {
    return this.api.post<PlatformUser>(`/api/v1/platform/users/${userId}/force-password-reset`, {});
  }

  breakGlassDisable2Fa(userId: string, payload: BreakGlass2FaPayload): Observable<ApiResponse<PlatformUser>> {
    return this.api.post<PlatformUser>(`/api/v1/platform/users/${userId}/break-glass/disable-2fa`, {
      [ResponseKey.SUPPORT_TICKET]: payload.support_ticket,
      [ResponseKey.REASON]: payload.reason,
      [ResponseKey.CONFIRM_PASSWORD]: payload.confirm_password
    });
  }

  getHealth(): Observable<ApiResponse<HealthSnapshot>> {
    return this.api.get<HealthSnapshot>('/api/v1/platform/health');
  }

  getAuditLogs(query: AuditLogQuery): Observable<ApiResponse<PagedData<AuditLog>>> {
    return this.api.get<PagedData<AuditLog>>(`/api/v1/platform/audit-logs${buildQuery(query as Record<string, any>)}`);
  }

  getAuditLog(logId: string): Observable<ApiResponse<AuditLog>> {
    return this.api.get<AuditLog>(`/api/v1/platform/audit-logs/${logId}`);
  }

  getImpersonationLogs(query: ImpersonationLogQuery): Observable<ApiResponse<PagedData<ImpersonationLog>>> {
    return this.api.get<PagedData<ImpersonationLog>>(`/api/v1/platform/impersonation-logs${buildQuery(query as Record<string, any>)}`);
  }

  getAdmins(): Observable<ApiResponse<ListData<PlatformAdmin>>> {
    return this.api.get<ListData<PlatformAdmin>>('/api/v1/platform/admins');
  }

  grantAdmin(payload: GrantAdminPayload): Observable<ApiResponse<PlatformAdmin>> {
    return this.api.post<PlatformAdmin>('/api/v1/platform/admins', {
      [ResponseKey.EMAIL]: payload.email,
      [ResponseKey.ROLE]: payload.role,
      [ResponseKey.FULL_NAME]: payload.full_name
    });
  }

  disableAdmin(adminId: string, payload: AdminLifecyclePayload): Observable<ApiResponse<PlatformAdmin>> {
    return this.api.post<PlatformAdmin>(`/api/v1/platform/admins/${adminId}/disable`, {
      [ResponseKey.REASON]: payload.reason,
      [ResponseKey.CONFIRM_PASSWORD]: payload.confirm_password
    });
  }

  enableAdmin(adminId: string): Observable<ApiResponse<PlatformAdmin>> {
    return this.api.post<PlatformAdmin>(`/api/v1/platform/admins/${adminId}/enable`, {});
  }

  revokeAdmin(adminId: string, payload: AdminLifecyclePayload): Observable<ApiResponse<PlatformAdmin>> {
    return this.api.delete<PlatformAdmin>(`/api/v1/platform/admins/${adminId}`, {
      [ResponseKey.REASON]: payload.reason,
      [ResponseKey.CONFIRM_PASSWORD]: payload.confirm_password
    });
  }

  resetAdminPassword(adminId: string): Observable<ApiResponse<PlatformAdmin>> {
    return this.api.post<PlatformAdmin>(`/api/v1/platform/admins/${adminId}/reset-password`, {});
  }

  disableAdmin2Fa(adminId: string, payload: BreakGlass2FaPayload): Observable<ApiResponse<PlatformAdmin>> {
    return this.api.post<PlatformAdmin>(`/api/v1/platform/admins/${adminId}/disable-2fa`, {
      [ResponseKey.SUPPORT_TICKET]: payload.support_ticket,
      [ResponseKey.REASON]: payload.reason,
      [ResponseKey.CONFIRM_PASSWORD]: payload.confirm_password
    });
  }
}
