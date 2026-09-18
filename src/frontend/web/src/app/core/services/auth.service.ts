import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, AuthUser, LoginResult, TenantInfo } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private userSignal = signal<AuthUser | null>(this.loadStoredUser());
  private tokenSignal = signal<string | null>(localStorage.getItem('openerp_token'));
  private sessionIdSignal = signal<string | null>(localStorage.getItem('openerp_session_id'));

  public user = computed(() => this.userSignal());
  public token = computed(() => this.tokenSignal());
  public isAuthenticated = computed(() => !!this.tokenSignal());

  private loadStoredUser(): AuthUser | null {
    const raw = localStorage.getItem('openerp_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }

  registerPersonal(data: { email: string; password: string; fullName: string; phone?: string }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/register/personal', data);
  }

  verifyEmail(data: { email: string; otpCode: string }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/verify-email', data);
  }

  registerBusiness(data: any): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/register/business', data);
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/login', credentials).pipe(
      tap(res => {
        if (res.data.access_token && res.data.user) {
          this.setSession(res.data.access_token, res.data.session_id || '', res.data.user);
        }
      })
    );
  }

  selectTenant(data: { tenant_id: string; pre_auth_token: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/select-tenant', data).pipe(
      tap(res => {
        if (res.data.access_token && res.data.user) {
          this.setSession(res.data.access_token, res.data.session_id || '', res.data.user);
        }
      })
    );
  }

  verifyLogin2Fa(data: { code: string; pre_auth_token: string }): Observable<ApiResponse<LoginResult>> {
    return this.api.post<LoginResult>('/api/v1/auth/2fa/verify', data).pipe(
      tap(res => {
        if (res.data.access_token && res.data.user) {
          this.setSession(res.data.access_token, res.data.session_id || '', res.data.user);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/forgot-password', { email });
  }

  resetPassword(data: { token: string; new_password: string }): Observable<ApiResponse<any>> {
    return this.api.post('/api/v1/auth/reset-password', data);
  }

  setSession(token: string, sessionId: string, user: AuthUser) {
    localStorage.setItem('openerp_token', token);
    localStorage.setItem('openerp_session_id', sessionId);
    localStorage.setItem('openerp_user', JSON.stringify(user));
    this.tokenSignal.set(token);
    this.sessionIdSignal.set(sessionId);
    this.userSignal.set(user);
  }

  logout() {
    localStorage.removeItem('openerp_token');
    localStorage.removeItem('openerp_session_id');
    localStorage.removeItem('openerp_user');
    this.tokenSignal.set(null);
    this.sessionIdSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }
}
