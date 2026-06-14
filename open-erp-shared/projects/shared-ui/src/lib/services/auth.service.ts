import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  accessToken = signal<string | null>(null);

  getRole(): string | null {
    const token = this.accessToken();
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      return payload.role || null;
    } catch (e) {
      return null;
    }
  }

  checkSubdomain(subdomain: string): Observable<boolean> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.checkSubdomain, { subdomain });
    return this.http.get<{ success: boolean; data: { available: boolean } }>(url).pipe(
      map((res) => res.success && res.data.available)
    );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.register);
    return this.http.post<RegisterResponse>(url, payload);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.login);
    return this.http.post<LoginResponse>(url, payload).pipe(
      tap((res) => {
        if (res.success && res.data?.accessToken) {
          this.accessToken.set(res.data.accessToken);
          if (res.data.tenant) {
            localStorage.setItem('tenantId', res.data.tenant.id);
            if (res.data.tenant.subdomain) {
              localStorage.setItem('subdomain', res.data.tenant.subdomain);
            } else {
              localStorage.removeItem('subdomain');
            }
          }
        }
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.refresh);
    return this.http.post<LoginResponse>(url, {}).pipe(
      tap({
        next: (res) => {
          if (res.success && res.data?.accessToken) {
            this.accessToken.set(res.data.accessToken);
          } else {
            this.accessToken.set(null);
          }
        },
        error: () => {
          this.accessToken.set(null);
        },
      })
    );
  }

  logout(): Observable<any> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.logout);
    return this.http.post<any>(url, {}).pipe(
      tap(() => {
        this.accessToken.set(null);
      })
    );
  }

  activate(token: string): Observable<{ success: boolean; messageKey?: string; data?: { subdomain: string } }> {
    const url = this.config.buildUrl(API_ENDPOINTS.auth.activate);
    return this.http.post<{ success: boolean; messageKey?: string; data?: { subdomain: string } }>(url, { token });
  }
}
