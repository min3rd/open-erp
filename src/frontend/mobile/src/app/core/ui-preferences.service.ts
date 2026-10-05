import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, ResponseKey, ThemeId, UiPreferencesData } from '@shared';

/**
 * Tenant UI preferences (theme) — Sprint 04.
 * GET is available to any authenticated tenant user; PUT requires the
 * `core:tenant:settings-manage` permission server-side.
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
}
