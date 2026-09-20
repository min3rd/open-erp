import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { buildQuery } from '../utils/query.util';
import {
  ApiResponse,
  ListData,
  PluginArtifactUploadResult,
  PluginCatalogDetail,
  PluginCredentialItem,
  PluginCredentialPayload,
  PluginMarketplaceItem,
  PluginNotificationList,
  PluginOperationStatus,
  PluginRegisterVersionPayload,
  PluginVersionItem,
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

  registerCustom(payload: {
    plugin_key: string;
    name_key: string;
    description_key: string;
  } & Partial<PluginRegisterVersionPayload>): Observable<ApiResponse<PluginVersionItem>> {
    return this.api.post<PluginVersionItem>('/api/v1/tenant/plugins/register', {
      [ResponseKey.PLUGIN_KEY]: payload.plugin_key,
      [ResponseKey.NAME_KEY]: payload.name_key,
      [ResponseKey.DESCRIPTION_KEY]: payload.description_key,
      [ResponseKey.SOURCE]: payload.source,
      [ResponseKey.VERSION]: payload.version,
      manifest: payload.manifest,
      [ResponseKey.IMAGE_REF]: payload.image_ref,
      [ResponseKey.REGISTRY_HOST]: payload.registry_url,
      [ResponseKey.REPOSITORY]: payload.repository,
      [ResponseKey.TAG]: payload.tag,
      [ResponseKey.CHECKSUM]: payload.checksum,
      [ResponseKey.ARTIFACT_REF]: payload.artifact_ref
    });
  }

  deleteCustomCatalog(pluginKey: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/tenant/plugins/${pluginKey}/catalog`);
  }

  customVersions(pluginKey: string): Observable<ApiResponse<ListData<PluginVersionItem>>> {
    return this.api.get<ListData<PluginVersionItem>>(`/api/v1/tenant/plugins/${pluginKey}/versions`);
  }

  registerCustomVersion(pluginKey: string, payload: PluginRegisterVersionPayload): Observable<ApiResponse<PluginVersionItem>> {
    return this.api.post<PluginVersionItem>(`/api/v1/tenant/plugins/${pluginKey}/versions`, {
      [ResponseKey.SOURCE]: payload.source,
      [ResponseKey.VERSION]: payload.version,
      manifest: payload.manifest,
      [ResponseKey.IMAGE_REF]: payload.image_ref,
      [ResponseKey.REGISTRY_HOST]: payload.registry_url,
      [ResponseKey.REPOSITORY]: payload.repository,
      [ResponseKey.TAG]: payload.tag,
      [ResponseKey.CHECKSUM]: payload.checksum,
      [ResponseKey.ARTIFACT_REF]: payload.artifact_ref
    });
  }

  customVersionAction(pluginKey: string, version: string, action: string, reason: string): Observable<ApiResponse<unknown>> {
    return this.api.patch<unknown>(`/api/v1/tenant/plugins/${pluginKey}/versions/${version}`, {
      action,
      [ResponseKey.REASON]: reason
    });
  }

  deleteCustomVersion(pluginKey: string, version: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/tenant/plugins/${pluginKey}/versions/${version}`);
  }

  uploadArtifact(file: File): Observable<ApiResponse<PluginArtifactUploadResult>> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.api.post<PluginArtifactUploadResult>('/api/v1/tenant/plugins/artifacts/upload', form);
  }

  credentials(): Observable<ApiResponse<ListData<PluginCredentialItem>>> {
    return this.api.get<ListData<PluginCredentialItem>>('/api/v1/tenant/plugin-credentials');
  }

  createCredential(payload: PluginCredentialPayload): Observable<ApiResponse<PluginCredentialItem>> {
    return this.api.post<PluginCredentialItem>('/api/v1/tenant/plugin-credentials', {
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.REGISTRY_HOST]: payload.registry_host,
      [ResponseKey.USERNAME]: payload.username,
      [ResponseKey.SECRET]: payload.secret
    });
  }

  deleteCredential(id: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/tenant/plugin-credentials/${id}`);
  }

  testCredential(id: string): Observable<ApiResponse<{ connected: boolean }>> {
    return this.api.post<{ connected: boolean }>(`/api/v1/tenant/plugin-credentials/${id}/test`, {});
  }
}
