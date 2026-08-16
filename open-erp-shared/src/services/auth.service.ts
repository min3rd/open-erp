import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, UserProfile } from '../models/auth.model';
import { AppConfigService } from './app-config.service';
import { STORAGE_KEYS, RoleCode } from '../constants/permission.constant';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private configService = inject(AppConfigService);

  currentUser = signal<UserProfile | null>(this.getStoredUser());
  accessToken = signal<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null);
  isAuthenticated = computed(() => !!this.accessToken());

  private getStoredUser(): UserProfile | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  get authUrl(): string {
    const api = this.configService.api();
    return api.authServiceUrl || api.baseUrl;
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/auth/login`, request).pipe(
      tap((res: LoginResponse) => {
        this.saveAuthData(res);
      })
    );
  }

  saveAuthData(res: LoginResponse): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(res.user));
    }
    this.accessToken.set(res.accessToken);
    this.currentUser.set(res.user);
  }

  logout(redirectUrl: string = '/auth/login'): void {
    const token = this.accessToken();
    if (token) {
      this.http.post(`${this.authUrl}/auth/logout`, {}).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    }
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.router.navigate([redirectUrl]);
  }

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUser();
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionCode) || user.roles.includes(RoleCode.SUPER_ADMIN);
  }

  hasRole(roleCode: string): boolean {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.includes(roleCode) || user.roles.includes(RoleCode.SUPER_ADMIN);
  }
}
