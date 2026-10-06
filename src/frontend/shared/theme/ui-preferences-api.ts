import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { LayoutId, ShapeId, ThemeId, ThemeMode } from '../enums';
import { UserUiPreferencesData } from '../models';

/**
 * A user's UI preferences as stored on their account. `null` means "no explicit
 * choice", i.e. follow the tenant default (theme) or the theme's own default
 * (shape/layout/mode).
 */
export interface UiPreferences {
  theme: ThemeId | null;
  shape: ShapeId | null;
  layout: LayoutId | null;
  mode: ThemeMode | null;
  /** Tenant-wide default theme, used whenever `theme` is null. */
  tenantTheme: ThemeId;
}

/** Payload the client persists (full replace; null clears back to the default). */
export interface UiPreferencesUpdate {
  theme: ThemeId | null;
  shape: ShapeId | null;
  layout: LayoutId | null;
  mode: ThemeMode | null;
}

/**
 * App-supplied bridge to the UI-preferences APIs. Kept as a token so the shared
 * ThemeService stays HTTP/auth agnostic: Web and Mobile each provide an
 * implementation backed by their own ApiService + AuthService.
 */
export interface UiPreferencesApi {
  /** `GET /api/v1/account/ui-preferences` — this user's preferences (any user). */
  fetch(): Observable<UiPreferences>;
  /** `PUT /api/v1/account/ui-preferences` — saves this user's own choices. */
  update(preferences: UiPreferencesUpdate): Observable<unknown>;
  /** `PUT /api/v1/tenant/ui-preferences` — tenant default (owner/admin only server-side). */
  updateTenantTheme(theme: ThemeId): Observable<unknown>;
}

export const UI_PREFERENCES_API = new InjectionToken<UiPreferencesApi>('UI_PREFERENCES_API');

/** Maps the API payload onto the shared camelCase shape (missing data = defaults). */
export function toUiPreferences(data: UserUiPreferencesData | null | undefined): UiPreferences {
  return {
    theme: data?.theme ?? null,
    shape: data?.shape ?? null,
    layout: data?.layout ?? null,
    mode: data?.mode ?? null,
    tenantTheme: data?.tenant_theme ?? ThemeId.INDUSTRIAL
  };
}
