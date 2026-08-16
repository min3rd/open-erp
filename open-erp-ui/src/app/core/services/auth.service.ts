import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, UserProfile } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly ACCESS_TOKEN_KEY = 'erp_access_token';
  private readonly REFRESH_TOKEN_KEY = 'erp_refresh_token';
  private readonly USER_KEY = 'erp_user_profile';

  currentUser = signal<UserProfile | null>(this.getStoredUser());
  accessToken = signal<string | null>(localStorage.getItem(this.ACCESS_TOKEN_KEY));
  isAuthenticated = computed(() => !!this.accessToken());

  constructor() {
    // If token exists, load /me if needed
  }

  private getStoredUser(): UserProfile | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/login', request).pipe(
      tap(res => {
        this.saveAuthData(res);
      })
    );
  }

  saveAuthData(res: LoginResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.accessToken.set(res.accessToken);
    this.currentUser.set(res.user);
  }

  logout(): void {
    const token = this.accessToken();
    if (token) {
      this.http.post('/auth/logout', {}).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUser();
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionCode) || user.roles.includes('SUPER_ADMIN');
  }

  hasRole(roleCode: string): boolean {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.includes(roleCode) || user.roles.includes('SUPER_ADMIN');
  }
}
