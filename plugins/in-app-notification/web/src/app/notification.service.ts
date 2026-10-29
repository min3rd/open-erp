import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiResponse, ApiService, ListData } from '@shared';
import {
  NotificationDto,
  NotificationPreferenceDto,
  NotificationSettingsDto,
} from './notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private staticBase = inject(API_BASE_URL);
  /** Host origin (empty when Core proxies the plugin gateway on the same origin). */
  private runtimeOrigin = signal('');

  setRuntimeOrigin(origin: string): void {
    this.runtimeOrigin.set((origin ?? '').replace(/\/$/, ''));
  }

  private url(path: string): string {
    const prefix = this.staticBase || (this.runtimeOrigin() + '/api/v1/plugins/runtime/in-app-notification');
    return `${prefix}${path}`;
  }

  list(): Observable<ApiResponse<ListData<NotificationDto>>> {
    return this.api.get<ListData<NotificationDto>>(this.url('/api/v1/in-app-notification/notifications'));
  }

  markRead(id: string): Observable<ApiResponse<{ updated_count: number }>> {
    return this.api.post<{ updated_count: number }>(this.url(`/api/v1/in-app-notification/notifications/${id}/read`), {});
  }

  markAllRead(): Observable<ApiResponse<{ updated_count: number }>> {
    return this.api.post<{ updated_count: number }>(this.url('/api/v1/in-app-notification/notifications/read-all'), {});
  }

  preferences(): Observable<ApiResponse<NotificationPreferenceDto>> {
    return this.api.get<NotificationPreferenceDto>(this.url('/api/v1/in-app-notification/preferences'));
  }

  savePreferences(body: {
    channel_email: boolean;
    channel_in_app: boolean;
    level_min: string;
  }): Observable<ApiResponse<NotificationPreferenceDto>> {
    return this.api.put<NotificationPreferenceDto>(this.url('/api/v1/in-app-notification/preferences'), body);
  }

  settings(): Observable<ApiResponse<NotificationSettingsDto>> {
    return this.api.get<NotificationSettingsDto>(this.url('/api/v1/in-app-notification/settings'));
  }

  saveSettings(body: NotificationSettingsDto): Observable<ApiResponse<NotificationSettingsDto>> {
    return this.api.put<NotificationSettingsDto>(this.url('/api/v1/in-app-notification/settings'), body);
  }

  platformDefaults(): Observable<ApiResponse<NotificationSettingsDto>> {
    return this.http.get<ApiResponse<NotificationSettingsDto>>(
      `${this.runtimeOrigin()}/api/v1/tenant/notification-defaults`
    );
  }
}
