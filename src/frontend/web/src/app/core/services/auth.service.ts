import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, AuthUser, LoginResult, PlatformAdminRole, RefreshTokenData, SlugCheckData, TenantInfo } from '@shared';
import { decodeJwtPayload, readBooleanClaim, readStringArrayClaim } from '../utils/jwt.util';

const TOKEN_KEY = 'openerp_token';
const REFRESH_TOKEN_KEY = 'openerp_refresh_token';
const SESSION_ID_KEY = 'openerp_session_id';
const USER_KEY = 'openerp_user';
const PASSWORD_CHANGED_KEY = 'openerp_pwd_changed';

export const PRE_AUTH_TOKEN_KEY = 'openerp_preauth_token';
export const PRE_AUTH_TENANTS_KEY = 'openerp_preauth_tenants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private userSignal = signal<AuthUser | null>(this.loadStoredUser());
  private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private refreshTokenSignal = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  private sessionIdSignal = signal<string | null>(localStorage.getItem(SESSION_ID_KEY));
  private passwordChangedSignal = signal<boolean>(sessionStorage.getItem(PASSWORD_CHANGED_KEY) === '1');

  public user = computed(() => this.userSignal());
  public token = computed(() => this.tokenSignal());
  public isAuthenticated = computed(() => !!this.tokenSignal());

  /** Platform role claim from the access token (`SUPER_ADMIN` / `SUPPORT_ENGINEER`). */
  public platformRole = computed<string | null>(() => {
    const payload = decodeJwtPayload(this.tokenSignal());
    const role = payload?.['platform_role'];
    return typeof role === 'string' ? role : null;
  });

  /** Any platform portal role (SUPER_ADMIN or SUPPORT_ENGINEER). */
  public isPlatformAdmin = computed<boolean>(() => {
    const role = this.platformRole();
    return role === PlatformAdminRole.SUPER_ADMIN || role === PlatformAdminRole.SUPPORT_ENGINEER;
  });

  /** Sensitive platform actions (impersonation, admin lifecycle, lock/unlock). */
  public isPlatformSuperAdmin = computed<boolean>(
    () => this.platformRole() === PlatformAdminRole.SUPER_ADMIN
  );

  /**
   * Functional permission codes read from the access token.
   * Returns `null` while the Sprint 02 backend `permissions`/`functional_permissions`
   * claim is not deployed yet (callers fall back to "allow" to avoid lock-out).
   */
  public functionalPermissions = computed<string[] | null>(() => {
    const payload = decodeJwtPayload(this.tokenSignal());
    return (
      readStringArrayClaim(payload, 'functional_permissions') ??
      readStringArrayClaim(payload, 'permissions')
    );
  });

  public mustChangePassword = computed<boolean>(() => {
    if (this.passwordChangedSignal()) {
      return false;
    }
    return readBooleanClaim(decodeJwtPayload(this.tokenSignal()), 'must_change_password') === true;
  });

  hasPermission(permission: string): boolean | null {
    const permissions = this.functionalPermissions();
    if (permissions === null) {
      return null;
    }
    return permissions.includes(permission) || permissions.includes('*');
  }

  /** Platform admins set this after a successful mandatory password change. */
  markPasswordChanged() {
    sessionStorage.setItem(PASSWORD_CHANGED_KEY, '1');
    this.passwordChangedSignal.set(true);
  }

  constructor() {
    window.addEventListener('openerp:session-expired', () => {
      this.resetSignals();
    });
  }

  private loadStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }

  registerPersonal(data: { full_name: string; email: string; password: string; phone?: string }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/register/personal', data);
  }

  verifyEmail(data: { email: string; otp_code: string }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/verify-email', data);
  }

  registerBusiness(data: {
    admin: { full_name: string; email: string; password: string };
    tenant: { name: string; slug: string; tax_code: string; company_size: string; currency: string };
  }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/register/business', data);
  }

  checkSlug(slug: string): Observable<ApiResponse<SlugCheckData>> {
    return this.api.get<SlugCheckData>(`/api/v1/auth/check-slug?slug=${encodeURIComponent(slug)}`);
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/login', credentials).pipe(
      tap(res => {
        if (res.success && res.data?.access_token && res.data.user) {
          this.setSession(res.data.access_token, res.data.session_id || '', res.data.user, res.data.refresh_token);
        }
      })
    );
  }

  selectTenant(data: { tenant_id: string; pre_auth_token: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/select-tenant', data).pipe(
      tap(res => {
        if (res.success && res.data?.access_token && res.data.user) {
          this.setSession(res.data.access_token, res.data.session_id || '', res.data.user, res.data.refresh_token);
        }
      })
    );
  }

  verifyLogin2Fa(data: { code: string; pre_auth_token: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/2fa/verify-login', data).pipe(
      tap(res => {
        if (res.success && res.data?.access_token && res.data.user) {
          this.setSession(res.data.access_token, res.data.session_id || '', res.data.user, res.data.refresh_token);
        }
      })
    );
  }

  refreshAccessToken(): Observable<ApiResponse<RefreshTokenData>> {
    return this.api.post<RefreshTokenData>('/api/v1/auth/refresh', {
      refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY)
    });
  }

  hasRefreshToken(): boolean {
    return !!localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isTokenExpired(token: string, clockSkewSeconds = 0): boolean {
    const payload = this.decodeJwtPayload(token);
    if (!payload || typeof payload['exp'] !== 'number') {
      return true;
    }
    return payload['exp'] * 1000 <= Date.now() + clockSkewSeconds * 1000;
  }

  private decodeJwtPayload(token: string): Record<string, any> | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  }

  resendVerification(email: string): Observable<ApiResponse<null>> {
    return this.api.post<null>('/api/v1/auth/resend-verification', { email });
  }

  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/forgot-password', { email });
  }

  resetPassword(data: { token: string; new_password: string }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/reset-password', data);
  }

  storePreAuth(token: string, tenants?: TenantInfo[]) {
    sessionStorage.setItem(PRE_AUTH_TOKEN_KEY, token);
    if (tenants?.length) {
      sessionStorage.setItem(PRE_AUTH_TENANTS_KEY, JSON.stringify(tenants));
    } else {
      sessionStorage.removeItem(PRE_AUTH_TENANTS_KEY);
    }
  }

  getPreAuthToken(): string {
    return sessionStorage.getItem(PRE_AUTH_TOKEN_KEY) || '';
  }

  getPreAuthTenants(): TenantInfo[] {
    const raw = sessionStorage.getItem(PRE_AUTH_TENANTS_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  clearPreAuth() {
    sessionStorage.removeItem(PRE_AUTH_TOKEN_KEY);
    sessionStorage.removeItem(PRE_AUTH_TENANTS_KEY);
  }

  updateStoredUser(updates: Partial<AuthUser>) {
    const current = this.userSignal();
    if (!current) {
      return;
    }
    const updated: AuthUser = { ...current, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.userSignal.set(updated);
  }

  setSession(token: string, sessionId: string, user: AuthUser, refreshToken?: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    sessionStorage.removeItem(PASSWORD_CHANGED_KEY);
    this.passwordChangedSignal.set(false);
    this.tokenSignal.set(token);
    this.sessionIdSignal.set(sessionId);
    this.refreshTokenSignal.set(refreshToken || this.refreshTokenSignal());
    this.userSignal.set(user);
  }

  private resetSignals() {
    sessionStorage.removeItem(PASSWORD_CHANGED_KEY);
    this.passwordChangedSignal.set(false);
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.sessionIdSignal.set(null);
    this.userSignal.set(null);
  }

  clearSession(navigate = true) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(USER_KEY);
    this.resetSignals();
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.api.post('/api/v1/auth/logout', {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }
}
