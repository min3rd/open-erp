import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeId } from '../enums';

/**
 * App-supplied bridge to the tenant UI-preferences API. Kept as a token so the
 * shared ThemeService stays HTTP/auth agnostic: Web and Mobile each provide an
 * implementation backed by their own ApiService + AuthService.
 */
export interface TenantThemeApi {
  /** `GET /api/v1/tenant/ui-preferences` -> current tenant theme (null when unknown). */
  fetchTheme(): Observable<ThemeId | null>;
  /** `PUT /api/v1/tenant/ui-preferences` (tenant owner/admin only server-side). */
  updateTheme(theme: ThemeId): Observable<unknown>;
  /** Whether the current user may persist a tenant-wide theme. */
  canManage(): boolean;
}

export const TENANT_THEME_API = new InjectionToken<TenantThemeApi>('TENANT_THEME_API');
