import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_URI_USER, API_URI_ORGANIZATION, API_URI_COMMON } from '../../../../../../core/constant';
import {
  ApiResponse,
  ApiSingleResponse,
  unwrap,
  isApiResponse,
  ApiResponseError,
} from '../../../../../../core/api';
import { User } from '../../../../../../core/services/user-service';

/**
 * Extended user detail interface with additional fields
 */
export interface UserDetail extends User {
  roles?: string[];
  permissions?: string[];
  memberships?: UserMembership[];
  metadata?: Record<string, any>;
  updatedAt?: string;
  address?: {
    country?: string;
    street?: string;
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  dateOfBirth?: string;
  education?: {
    degree?: string;
    institution?: string;
    year?: number;
  }[];
  skills?: string[];
  hobbies?: string[];
}

/**
 * User membership/tenant information
 */
export interface UserMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode?: string;
  role: string;
  roles?: string[];
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
}

/**
 * Role information
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  scope: 'global' | 'organization';
  permissions?: string[];
}

/**
 * Backend API response format for roles (can be string or object)
 */
export type RoleApiResponse = string | {
  id?: string;
  name: string;
  description?: string;
  permissions?: string[];
};

/**
 * Permission information
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
}

/**
 * Backend API response format for permissions (can be string or object)
 */
export type PermissionApiResponse = string | {
  id?: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
};

/**
 * User roles and permissions response
 */
export interface UserRolesPermissions {
  userId: string;
  globalRoles: Role[];
  globalPermissions: Permission[];
  orgRoles?: Role[];
  orgPermissions?: Permission[];
  effectivePermissions?: Permission[];
}

/**
 * Organization basic info
 */
export interface OrganizationBasic {
  id: string;
  name: string;
  internationalName?: string;
  code?: string;
  taxId?: string;
}

/**
 * User activity log entry
 */
export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  entity?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure';
  payload?: Record<string, any>;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
  createdAt?: string;
}

/**
 * User activity logs response
 */
export interface UserActivityLogsResponse {
  data: UserActivityLog[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Admin reset password response
 */
export interface AdminResetPasswordResponse {
  success: boolean;
  userId: string;
  generatedPassword?: string;
  emailSent: boolean;
  sessionsRevoked: boolean;
  tokenVersion: number;
}

/**
 * Admin revoke sessions response
 */
export interface AdminRevokeSessionsResponse {
  success: boolean;
  userId: string;
  tokensRevoked: number;
  tokenVersion: number;
}

/**
 * Admin block user response
 */
export interface AdminBlockUserResponse {
  success: boolean;
  userId: string;
  blockedAt: Date;
  reason: string;
  emailSent: boolean;
  sessionsRevoked: boolean;
}

/**
 * Admin unblock user response
 */
export interface AdminUnblockUserResponse {
  success: boolean;
  userId: string;
  emailSent: boolean;
}

/**
 * Service for user detail operations
 * Handles fetching and managing user detail data
 */
@Injectable({
  providedIn: 'root',
})
export class UserDetailService {
  private http = inject(HttpClient);

  // Observable to notify subscribers of user updates
  private userUpdatedSubject = new BehaviorSubject<UserDetail | null>(null);
  public userUpdated$ = this.userUpdatedSubject.asObservable();

  /**
   * Get user detail by ID
   */
  getUserDetail(userId: string): Observable<UserDetail> {
    return this.http
      .get<ApiSingleResponse<UserDetail>>(`${API_URI_USER}/v1/users/${userId}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item as UserDetail;
          }
          // Legacy format fallback
          return response as unknown as UserDetail;
        }),
        tap((user) => {
          // Emit user update to subscribers
          this.userUpdatedSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get user memberships/tenants
   */
  getUserMemberships(userId: string): Observable<UserMembership[]> {
    return this.http
      .get<ApiResponse<UserMembership[]>>(`${API_URI_USER}/v1/users/${userId}/memberships`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as UserMembership[];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get user organizations
   * Returns all organizations the user belongs to
   */
  getUserOrganizations(userId: string): Observable<OrganizationBasic[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${API_URI_ORGANIZATION}/v1/orgs/user/${userId}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            // Transform backend response to OrganizationBasic format
            return data.map((org: any) => ({
              id: org.orgId,
              name: org.orgName,
              internationalName: org.orgName,
              code: org.orgCode,
              taxId: org.orgCode,
            }));
          }
          return response as unknown as OrganizationBasic[];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get user roles and permissions
   * @param userId - User identifier
   * @param orgId - Optional organization ID to get org-specific roles
   */
  getUserRolesPermissions(userId: string, orgId?: string): Observable<UserRolesPermissions> {
    let params = new HttpParams();
    if (orgId) {
      params = params.set('orgId', orgId);
    }

    return this.http
      .get<ApiResponse<any>>(`${API_URI_ORGANIZATION}/v1/users/${userId}/roles-permissions`, { params })
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            // Transform backend response format
            const result: UserRolesPermissions = {
              userId: userId,
              globalRoles: (data.globalRoles || []).map((name: string) => ({
                id: name,
                name: name,
                scope: 'global' as const,
              })),
              globalPermissions: (data.globalPermissions || []).map((name: string) => ({
                id: name,
                name: name,
              })),
              orgRoles: [],
              orgPermissions: [],
            };

            // If orgId is provided, extract org-specific roles
            if (orgId && data.orgRoles && data.orgRoles[orgId]) {
              result.orgRoles = data.orgRoles[orgId].map((name: string) => ({
                id: name,
                name: name,
                scope: 'organization' as const,
              }));
            }

            if (orgId && data.orgPermissions && data.orgPermissions[orgId]) {
              result.orgPermissions = data.orgPermissions[orgId].map((name: string) => ({
                id: name,
                name: name,
              }));
            }

            return result;
          }
          return response as unknown as UserRolesPermissions;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Grant roles to user in an organization
   * This replaces all existing roles with the provided ones
   * @param orgId - Organization identifier
   * @param userId - User identifier
   * @param roleIds - Array of role IDs to grant (replaces all existing roles)
   */
  grantRolesToUserInOrg(orgId: string, userId: string, roleIds: string[]): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(
        `${API_URI_ORGANIZATION}/v1/orgs/${orgId}/members/${userId}/grant`,
        { roles: roleIds }
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Generic method to fetch resources (roles or permissions) from appropriate endpoint
   * @param resourceType - Type of resource to fetch ('roles' or 'permissions')
   * @param orgId - Organization identifier (optional, for global resources omit this)
   * @param transform - Function to transform individual resource items
   */
  private getResources<T>(
    resourceType: 'roles' | 'permissions',
    orgId: string | undefined,
    transform: (item: RoleApiResponse | PermissionApiResponse, orgId?: string) => T
  ): Observable<T[]> {
    // Use different endpoints based on scope and resource type
    const url = orgId
      ? `${API_URI_ORGANIZATION}/v1/orgs/${resourceType}`
      : `${API_URI_COMMON}/v1/common/${resourceType}/global`;

    let params = new HttpParams();
    if (orgId) {
      params = params.set('orgId', orgId);
    }

    return this.http.get<ApiResponse<(RoleApiResponse | PermissionApiResponse)[]>>(url, { params }).pipe(
      map((response) => {
        if (isApiResponse(response)) {
          const data = unwrap(response);
          return data.map((item) => transform(item, orgId));
        }
        return response as unknown as T[];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get available roles for an organization or global roles
   * @param orgId - Organization identifier (optional, for global roles omit this)
   */
  getAvailableRoles(orgId?: string): Observable<Role[]> {
    return this.getResources<Role>('roles', orgId, (role: RoleApiResponse, orgId?: string) => {
      if (typeof role === 'string') {
        return {
          id: role,
          name: role,
          scope: orgId ? ('organization' as const) : ('global' as const),
        };
      }
      // If backend returns objects, use them directly
      return {
        id: role.id || role.name,
        name: role.name,
        description: role.description,
        scope: orgId ? ('organization' as const) : ('global' as const),
        permissions: role.permissions,
      };
    });
  }

  /**
   * Get available permissions for an organization or global permissions
   * @param orgId - Organization identifier (optional, for global permissions omit this)
   */
  getAvailablePermissions(orgId?: string): Observable<Permission[]> {
    return this.getResources<Permission>('permissions', orgId, (permission: PermissionApiResponse, orgId?: string) => {
      if (typeof permission === 'string') {
        return {
          id: permission,
          name: permission,
        };
      }
      // If backend returns objects, use them directly
      return {
        id: permission.id || permission.name,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
      };
    });
  }

  /**
   * Get user activity logs
   */
  getUserActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    sortField?: string,
    sortOrder?: 'asc' | 'desc'
  ): Observable<UserActivityLogsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    if (sortField) {
      params = params.set('sortField', sortField);
    }
    if (sortOrder) {
      params = params.set('sortOrder', sortOrder);
    }

    return this.http
      .get<ApiResponse<UserActivityLogsResponse>>(
        `${API_URI_USER}/v1/admin/users/${userId}/audit-logs`,
        { params }
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as UserActivityLogsResponse;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get audit log detail by ID
   */
  getAuditLogDetail(logId: string): Observable<UserActivityLog> {
    return this.http
      .get<ApiSingleResponse<UserActivityLog>>(
        `${API_URI_USER}/v1/admin/users/audit-logs/${logId}`
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item as UserActivityLog;
          }
          return response as unknown as UserActivityLog;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update user
   */
  updateUser(userId: string, data: Partial<UserDetail>): Observable<UserDetail> {
    return this.http
      .patch<ApiSingleResponse<UserDetail>>(`${API_URI_USER}/v1/users/${userId}`, data)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const result = unwrap(response);
            return result.item as UserDetail;
          }
          return response as unknown as UserDetail;
        }),
        tap((user) => {
          // Emit user update to subscribers
          this.userUpdatedSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Disable/block a user
   */
  disableUser(userId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_URI_USER}/v1/users/${userId}/disable`, {})
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Enable a user
   */
  enableUser(userId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_URI_USER}/v1/users/${userId}/enable`, {})
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Reset user password
   */
  resetPassword(userId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_URI_USER}/v1/users/${userId}/reset-password`, {})
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Send user invitation
   */
  sendInvitation(userId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_URI_USER}/v1/users/${userId}/send-invitation`, {})
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Impersonate user (if allowed)
   */
  impersonateUser(userId: string): Observable<{ token: string }> {
    return this.http
      .post<ApiResponse<{ token: string }>>(
        `${API_URI_USER}/v1/users/${userId}/impersonate`,
        {}
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as { token: string };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Admin: Reset user password
   */
  adminResetPassword(
    identifier: string,
    data: {
      password?: string;
      forceResetOnNextLogin?: boolean;
      sendEmail?: boolean;
      revokeSessions?: boolean;
      reason?: string;
    }
  ): Observable<AdminResetPasswordResponse> {
    return this.http
      .post<ApiResponse<AdminResetPasswordResponse>>(
        `${API_URI_USER}/v1/admin/users/${identifier}/reset-password`,
        data
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as AdminResetPasswordResponse;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Admin: Revoke user sessions
   */
  adminRevokeSessions(
    identifier: string,
    data: {
      revokeRefreshTokens?: boolean;
      revokeAllDevices?: boolean;
      reason?: string;
    }
  ): Observable<AdminRevokeSessionsResponse> {
    return this.http
      .post<ApiResponse<AdminRevokeSessionsResponse>>(
        `${API_URI_USER}/v1/admin/users/${identifier}/revoke-sessions`,
        data
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as AdminRevokeSessionsResponse;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Admin: Block user
   */
  adminBlockUser(
    identifier: string,
    data: {
      reason: string;
      softBlock?: boolean;
      revokeSessions?: boolean;
      sendEmail?: boolean;
    }
  ): Observable<AdminBlockUserResponse> {
    return this.http
      .post<ApiResponse<AdminBlockUserResponse>>(
        `${API_URI_USER}/v1/admin/users/${identifier}/block`,
        data
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as AdminBlockUserResponse;
        }),
        tap(() => {
          // Reload user to update status
          const user = this.userUpdatedSubject.value;
          if (
            user &&
            (user.id === identifier || user.username === identifier || user.email === identifier)
          ) {
            this.getUserDetail(user.id).subscribe();
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Admin: Unblock user
   */
  adminUnblockUser(
    identifier: string,
    data: {
      reason?: string;
      sendEmail?: boolean;
    }
  ): Observable<AdminUnblockUserResponse> {
    return this.http
      .post<ApiResponse<AdminUnblockUserResponse>>(
        `${API_URI_USER}/v1/admin/users/${identifier}/unblock`,
        data
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as AdminUnblockUserResponse;
        }),
        tap(() => {
          // Reload user to update status
          const user = this.userUpdatedSubject.value;
          if (
            user &&
            (user.id === identifier || user.username === identifier || user.email === identifier)
          ) {
            this.getUserDetail(user.id).subscribe();
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse | ApiResponseError): Observable<never> {
    let errorMessage = 'An error occurred';

    // Handle ApiResponseError from unwrap
    if (error instanceof ApiResponseError) {
      errorMessage = error.message;
      console.error('UserDetailService API error:', errorMessage, error);
      return throwError(() => error);
    }

    // Handle HTTP errors
    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network error: ${error.error.message}`;
      } else {
        // Check if error response has API envelope
        if (isApiResponse(error.error)) {
          try {
            unwrap(error.error);
          } catch (apiError) {
            if (apiError instanceof ApiResponseError) {
              return throwError(() => apiError);
            }
          }
        }

        // Backend returned an unsuccessful response code
        switch (error.status) {
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            break;
          case 403:
            errorMessage = 'Forbidden. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'User not found.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage = `Server error: ${error.status} - ${error.message}`;
        }
      }
    }

    console.error('UserDetailService error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
