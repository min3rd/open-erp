import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ApiResponse,
  LayoutId,
  ResponseKey,
  ShapeId,
  ThemeId,
  ThemeMode,
  UiPreferencesData,
  UserUiPreferencesData
} from '@shared';

/** Appearance preference payload sent by the client (null = follow the default). */
export interface UserUiPreferencesUpdate {
  theme: ThemeId | null;
  shape: ShapeId | null;
  layout: LayoutId | null;
  mode: ThemeMode | null;
}

/**
 * UI preferences — Sprint 04.
 * `/api/v1/account/ui-preferences` is the signed-in user's own appearance and is
 * open to any authenticated user; `/api/v1/tenant/ui-preferences` is the tenant
 * default theme and requires `core:tenant:settings-manage` server-side.
 */
@Injectable({
  providedIn: 'root'
})
export class UiPreferencesService {
  private api = inject(ApiService);

  getUiPreferences(): Observable<ApiResponse<UiPreferencesData>> {
    return this.api.get<UiPreferencesData>('/api/v1/tenant/ui-preferences');
  }

  updateUiPreferences(theme: ThemeId): Observable<ApiResponse<UiPreferencesData>> {
    return this.api.put<UiPreferencesData>('/api/v1/tenant/ui-preferences', {
      [ResponseKey.THEME]: theme
    });
  }

  getUserUiPreferences(): Observable<ApiResponse<UserUiPreferencesData>> {
    return this.api.get<UserUiPreferencesData>('/api/v1/account/ui-preferences');
  }

  updateUserUiPreferences(
    preferences: UserUiPreferencesUpdate
  ): Observable<ApiResponse<UserUiPreferencesData>> {
    return this.api.put<UserUiPreferencesData>('/api/v1/account/ui-preferences', {
      [ResponseKey.THEME]: preferences.theme,
      [ResponseKey.SHAPE]: preferences.shape,
      [ResponseKey.LAYOUT]: preferences.layout,
      [ResponseKey.MODE]: preferences.mode
    });
  }
}
