import { Injectable, inject, signal, computed } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { Observable, tap, catchError, of, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, AuthUser, LoginResult, TenantInfo } from '@shared';
import { SlugAvailability, VerifyEmailResult } from './models';
import { getJwtPermissions, isPlatformSuperAdmin } from './jwt.util';
import { STORAGE_KEY_PLATFORM_TOKEN } from './storage-keys';

const TOKEN_KEY = 'openerp_token';
const REFRESH_TOKEN_KEY = 'openerp_refresh_token';
const SESSION_ID_KEY = 'openerp_session_id';
const USER_KEY = 'openerp_user';
const PREAUTH_TOKEN_KEY = 'openerp_preauth_token';
const PREAUTH_TENANTS_KEY = 'openerp_preauth_tenants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private navCtrl = inject(NavController);

  private userSignal = signal<AuthUser | null>(this.loadStoredUser());
  private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private sessionIdSignal = signal<string | null>(localStorage.getItem(SESSION_ID_KEY));
  private platformTokenSignal = signal<string | null>(localStorage.getItem(STORAGE_KEY_PLATFORM_TOKEN));

  public user = computed(() => this.userSignal());
  public token = computed(() => this.tokenSignal());
  public sessionId = computed(() => this.sessionIdSignal());
  public platformToken = computed(() => this.platformTokenSignal());
  public isAuthenticated = computed(() => !!this.tokenSignal());
  public isPlatformAdmin = computed(() =>
    isPlatformSuperAdmin(this.platformTokenSignal() ?? this.tokenSignal())
  );

  /**
   * @returns `true`/`false` when the tenant JWT carries the `permissions` claim,
   * `null` when the claim is absent (Sprint 02 claim not deployed yet).
   */
  hasPermission(permission: string): boolean | null {
    const permissions = getJwtPermissions(this.tokenSignal());
    if (permissions === null) {
      return null;
    }
    return permissions.includes(permission);
  }

  private loadStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as AuthUser;
      } catch {
        return null;
      }
    }
    return null;
  }

  registerPersonal(data: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }): Observable<ApiResponse<{ user_id: string; email: string; status: string }>> {
    return this.api.post('/api/v1/auth/register/personal', data);
  }

  verifyEmail(email: string, otpCode: string): Observable<ApiResponse<VerifyEmailResult>> {
    return this.api.post<VerifyEmailResult>('/api/v1/auth/verify-email', {
      email,
      otp_code: otpCode
    });
  }

  resendVerification(email: string): Observable<ApiResponse<null>> {
    return this.api.post<null>('/api/v1/auth/resend-verification', { email });
  }

  registerBusiness(data: {
    admin: { full_name: string; email: string; password: string };
    tenant: {
      name: string;
      slug: string;
      tax_code?: string;
      company_size?: string;
      currency?: string;
    };
  }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/register/business', data);
  }

  checkSlug(slug: string): Observable<ApiResponse<SlugAvailability>> {
    return this.api.get<SlugAvailability>(`/api/v1/auth/check-slug?slug=${encodeURIComponent(slug)}`);
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/login', credentials).pipe(
      tap(res => this.applySessionIfReady(res.data))
    );
  }

  selectTenant(data: { tenant_id: string; pre_auth_token: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/select-tenant', data).pipe(
      tap(res => this.applySessionIfReady(res.data))
    );
  }

  verifyLogin2Fa(data: { code: string; pre_auth_token: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/2fa/verify-login', data).pipe(
      tap(res => this.applySessionIfReady(res.data))
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.api.post<null>('/api/v1/auth/forgot-password', { email });
  }

  resetPassword(data: { token: string; new_password: string }): Observable<ApiResponse<null>> {
    return this.api.post<null>('/api/v1/auth/reset-password', data);
  }

  savePreAuth(token: string, tenants?: TenantInfo[]) {
    if (!token) return;
    sessionStorage.setItem(PREAUTH_TOKEN_KEY, token);
    if (tenants) {
      sessionStorage.setItem(PREAUTH_TENANTS_KEY, JSON.stringify(tenants));
    } else {
      sessionStorage.removeItem(PREAUTH_TENANTS_KEY);
    }
  }

  getPreAuthToken(): string | null {
    return sessionStorage.getItem(PREAUTH_TOKEN_KEY);
  }

  getPreAuthTenants(): TenantInfo[] {
    const raw = sessionStorage.getItem(PREAUTH_TENANTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as TenantInfo[];
    } catch {
      return [];
    }
  }

  clearPreAuth() {
    sessionStorage.removeItem(PREAUTH_TOKEN_KEY);
    sessionStorage.removeItem(PREAUTH_TENANTS_KEY);
  }

  setSession(token: string, sessionId: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.tokenSignal.set(token);
    this.sessionIdSignal.set(sessionId);
    this.userSignal.set(user);
  }

  /**
   * Platform Super Admin token is stored separately from the tenant token so the
   * same device can hold both sessions. ApiService selects it for `/api/v1/platform/*`.
   */
  setPlatformToken(token: string | null) {
    if (token) {
      localStorage.setItem(STORAGE_KEY_PLATFORM_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_PLATFORM_TOKEN);
    }
    this.platformTokenSignal.set(token);
  }

  clearPlatformToken() {
    this.setPlatformToken(null);
  }

  logout() {
    this.api.post('/api/v1/auth/logout', {}).pipe(
      catchError(() => of(null))
    ).subscribe(() => this.clearSession());
  }

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(STORAGE_KEY_PLATFORM_TOKEN);
    this.tokenSignal.set(null);
    this.sessionIdSignal.set(null);
    this.userSignal.set(null);
    this.platformTokenSignal.set(null);
    this.navCtrl.navigateRoot('/login', { animationDirection: 'back', replaceUrl: true });
  }

  /**
   * Persists the authenticated session once the backend issues tokens.
   * Shared models already use the snake_case API contract (`user_id`, `tenant_id`...).
   *
   * TODO(platform-login): the Platform Portal login flow is not part of Mobile
   * Wave 1. When the Backend returns a dedicated platform token, it is picked up
   * here opportunistically (`platform_access_token` / `platform_token`).
   */
  private applySessionIfReady(data: LoginResult) {
    if (!data.access_token || !data.user) return;

    const extras = data as unknown as Record<string, unknown>;
    const platformToken = extras['platform_access_token'] ?? extras['platform_token'];
    if (typeof platformToken === 'string' && platformToken) {
      this.setPlatformToken(platformToken);
    }

    if (data.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    }
    this.clearPreAuth();
    this.setSession(data.access_token, data.session_id || '', data.user);
  }
}
