import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { buildQuery } from '../utils/query.util';
import {
  ApiResponse,
  ListData,
  PluginCatalogDetail,
  PluginMarketplaceItem,
  PluginNotificationList,
  PluginOperationStatus,
  ResponseKey
} from '@shared';

@Injectable({
  providedIn: 'root'
})
export class PluginService {
  private api = inject(ApiService);

  marketplace(): Observable<ApiResponse<ListData<PluginMarketplaceItem>>> {
    return this.api.get<ListData<PluginMarketplaceItem>>('/api/v1/tenant/plugins');
  }

  detail(pluginKey: string): Observable<ApiResponse<PluginCatalogDetail>> {
    return this.api.get<PluginCatalogDetail>(`/api/v1/tenant/plugins/${pluginKey}`);
  }

  install(pluginKey: string, version?: string | null): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.post<PluginOperationStatus>(`/api/v1/tenant/plugins/${pluginKey}/install`, {
      [ResponseKey.VERSION]: version ?? null
    });
  }

  enable(pluginKey: string): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.post<PluginOperationStatus>(`/api/v1/tenant/plugins/${pluginKey}/enable`, {});
  }

  disable(pluginKey: string): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.post<PluginOperationStatus>(`/api/v1/tenant/plugins/${pluginKey}/disable`, {});
  }

  upgrade(pluginKey: string, targetVersion: string, snapshot: boolean): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.post<PluginOperationStatus>(`/api/v1/tenant/plugins/${pluginKey}/upgrade`, {
      [ResponseKey.TARGET_VERSION]: targetVersion,
      [ResponseKey.SNAPSHOT]: snapshot
    });
  }

  uninstall(pluginKey: string): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.post<PluginOperationStatus>(`/api/v1/tenant/plugins/${pluginKey}/uninstall`, {
      [ResponseKey.CONFIRM_KEEP_DATA]: true
    });
  }

  operation(operationId: string): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.get<PluginOperationStatus>(`/api/v1/plugins/operations/${operationId}`);
  }

  notifications(unreadOnly: boolean = false): Observable<ApiResponse<PluginNotificationList>> {
    const query = buildQuery({ [ResponseKey.UNREAD_ONLY]: unreadOnly || undefined });
    return this.api.get<PluginNotificationList>(`/api/v1/tenant/notifications${query}`);
  }

  markNotificationRead(notificationId: string): Observable<ApiResponse<null>> {
    return this.api.post<null>(`/api/v1/tenant/notifications/${notificationId}/read`, {});
  }

  markAllNotificationsRead(): Observable<ApiResponse<null>> {
    return this.api.post<null>('/api/v1/tenant/notifications/read-all', {});
  }
}
