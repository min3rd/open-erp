var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { STORAGE_KEYS, RoleCode } from '../constants/permission.constant';
let AuthService = class AuthService {
    http = inject(HttpClient);
    router = inject(Router);
    configService = inject(AppConfigService);
    currentUser = signal(this.getStoredUser());
    accessToken = signal(typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null);
    isAuthenticated = computed(() => !!this.accessToken());
    getStoredUser() {
        if (typeof localStorage === 'undefined')
            return null;
        const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    get authUrl() {
        const api = this.configService.api();
        return api.authServiceUrl || api.baseUrl;
    }
    login(request) {
        return this.http.post(`${this.authUrl}/auth/login`, request).pipe(tap((res) => {
            this.saveAuthData(res);
        }));
    }
    saveAuthData(res) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.accessToken);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.refreshToken);
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(res.user));
        }
        this.accessToken.set(res.accessToken);
        this.currentUser.set(res.user);
    }
    logout(redirectUrl = '/auth/login') {
        const token = this.accessToken();
        if (token) {
            this.http.post(`${this.authUrl}/auth/logout`, {}).subscribe({
                next: () => { },
                error: () => { }
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
    hasPermission(permissionCode) {
        const user = this.currentUser();
        if (!user || !user.permissions)
            return false;
        return user.permissions.includes(permissionCode) || user.roles.includes(RoleCode.SUPER_ADMIN);
    }
    hasRole(roleCode) {
        const user = this.currentUser();
        if (!user || !user.roles)
            return false;
        return user.roles.includes(roleCode) || user.roles.includes(RoleCode.SUPER_ADMIN);
    }
};
AuthService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map