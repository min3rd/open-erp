import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { buildQuery } from '../utils/query.util';
import {
  ApiResponse,
  PagedData,
  PluginActionResult,
  PluginArtifactUploadResult,
  PluginBlockPayload,
  PluginBulkApplyPayload,
  PluginBulkPreview,
  PluginBulkReport,
  PluginCatalogDetail,
  PluginCatalogItem,
  PluginCredentialItem,
  PluginCredentialPayload,
  PluginInstallationItem,
  PluginOperationStatus,
  PluginRegisterCatalogPayload,
  PluginRegisterVersionPayload,
  PluginUpdateCatalogPayload,
  ResponseKey
} from '@shared';

@Injectable({
  providedIn: 'root'
})
export class PlatformPluginService {
  private api = inject(ApiService);

  list(query: {
    page?: number;
    size?: number;
    keyword?: string;
    catalog_status?: string;
  }): Observable<ApiResponse<PagedData<PluginCatalogItem>>> {
    return this.api.get<PagedData<PluginCatalogItem>>(
      `/api/v1/platform/plugins${buildQuery({ ...query, page: query.page ?? 0, size: query.size ?? 20 })}`
    );
  }

  detail(pluginKey: string): Observable<ApiResponse<PluginCatalogDetail>> {
    return this.api.get<PluginCatalogDetail>(`/api/v1/platform/plugins/${pluginKey}`);
  }

  createCatalog(payload: PluginRegisterCatalogPayload): Observable<ApiResponse<PluginCatalogItem>> {
    return this.api.post<PluginCatalogItem>('/api/v1/platform/plugins', {
      [ResponseKey.PLUGIN_KEY]: payload.plugin_key,
      [ResponseKey.NAME_KEY]: payload.name_key,
      [ResponseKey.DESCRIPTION_KEY]: payload.description_key,
      [ResponseKey.ENTITLEMENT_PLANS]: payload.entitlement_plans ?? [],
      [ResponseKey.DEFAULT_INSTALL]: payload.default_install ?? false,
      [ResponseKey.LOCKED]: payload.locked ?? false
    });
  }

  updateCatalog(pluginKey: string, payload: PluginUpdateCatalogPayload): Observable<ApiResponse<PluginCatalogItem>> {
    return this.api.patch<PluginCatalogItem>(`/api/v1/platform/plugins/${pluginKey}`, {
      [ResponseKey.NAME_KEY]: payload.name_key,
      [ResponseKey.DESCRIPTION_KEY]: payload.description_key,
      [ResponseKey.ENTITLEMENT_PLANS]: payload.entitlement_plans,
      [ResponseKey.DEFAULT_INSTALL]: payload.default_install,
      [ResponseKey.LOCKED]: payload.locked
    });
  }

  deleteCatalog(pluginKey: string): Observable<ApiResponse<PluginActionResult>> {
    return this.api.delete<PluginActionResult>(`/api/v1/platform/plugins/${pluginKey}`);
  }

  registerVersion(pluginKey: string, payload: PluginRegisterVersionPayload): Observable<ApiResponse<unknown>> {
    return this.api.post<unknown>(`/api/v1/platform/plugins/${pluginKey}/versions`, {
      [ResponseKey.SOURCE]: payload.source,
      [ResponseKey.VERSION]: payload.version,
      manifest: payload.manifest,
      [ResponseKey.IMAGE_REF]: payload.image_ref,
      [ResponseKey.REGISTRY_HOST]: payload.registry_url,
      [ResponseKey.REPOSITORY]: payload.repository,
      [ResponseKey.TAG]: payload.tag,
      [ResponseKey.DIGEST]: payload.digest,
      [ResponseKey.CHECKSUM]: payload.checksum,
      [ResponseKey.ARTIFACT_REF]: payload.artifact_ref,
      [ResponseKey.CREDENTIAL_ID]: payload.credential_id
    });
  }

  versionAction(pluginKey: string, version: string, action: string, reason: string): Observable<ApiResponse<PluginActionResult>> {
    return this.api.patch<PluginActionResult>(`/api/v1/platform/plugins/${pluginKey}/versions/${version}`, {
      action,
      [ResponseKey.REASON]: reason
    });
  }

  unblockVersion(pluginKey: string, version: string, reason: string): Observable<ApiResponse<PluginActionResult>> {
    return this.api.patch<PluginActionResult>(
      `/api/v1/platform/plugins/${pluginKey}/versions/${version}/unblock`,
      { [ResponseKey.REASON]: reason }
    );
  }

  blockCatalog(pluginKey: string, payload: PluginBlockPayload): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.post<PluginOperationStatus>(`/api/v1/platform/plugins/${pluginKey}/block`, {
      [ResponseKey.REASON]: payload.reason,
      [ResponseKey.SCOPE]: payload.scope,
      [ResponseKey.VERSION]: payload.version ?? null,
      [ResponseKey.FORCE_UNINSTALL]: payload.force_uninstall,
      confirmations: {
        [ResponseKey.AFFECTED_TENANTS]: payload.confirmations.affected_tenants,
        [ResponseKey.CONFIRM_TEXT]: payload.confirmations.confirm_text
      }
    });
  }

  unblockCatalog(pluginKey: string, reason: string): Observable<ApiResponse<PluginActionResult>> {
    return this.api.post<PluginActionResult>(`/api/v1/platform/plugins/${pluginKey}/unblock`, {
      [ResponseKey.REASON]: reason
    });
  }

  uploadArtifact(file: File): Observable<ApiResponse<PluginArtifactUploadResult>> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.api.post<PluginArtifactUploadResult>('/api/v1/platform/plugins/artifacts/upload', form);
  }

  installations(pluginKey: string, page: number = 0, size: number = 20): Observable<ApiResponse<PagedData<PluginInstallationItem>>> {
    return this.api.get<PagedData<PluginInstallationItem>>(
      `/api/v1/platform/plugins/${pluginKey}/installations${buildQuery({ page, size })}`
    );
  }

  operation(operationId: string): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.get<PluginOperationStatus>(`/api/v1/plugins/operations/${operationId}`);
  }

  bulkPreview(pluginKey: string): Observable<ApiResponse<PluginBulkPreview>> {
    return this.api.post<PluginBulkPreview>(`/api/v1/platform/plugins/${pluginKey}/bulk-apply/preview`, {});
  }

  bulkApply(pluginKey: string, payload: PluginBulkApplyPayload): Observable<ApiResponse<PluginBulkReport>> {
    return this.api.post<PluginBulkReport>(`/api/v1/platform/plugins/${pluginKey}/bulk-apply`, payload);
  }

  supportAction(pluginKey: string, tenantId: string, action: string, version: string | null, reason: string):
    Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.post<PluginOperationStatus>(
      `/api/v1/platform/plugins/${pluginKey}/tenants/${tenantId}/${action}`,
      { [ResponseKey.VERSION]: version, [ResponseKey.REASON]: reason }
    );
  }

  grantEntitlement(tenantId: string, pluginKey: string): Observable<ApiResponse<unknown>> {
    return this.api.put<unknown>(`/api/v1/platform/tenants/${tenantId}/plugins/${pluginKey}/entitlement`, {});
  }

  revokeEntitlement(tenantId: string, pluginKey: string): Observable<ApiResponse<unknown>> {
    return this.api.delete<unknown>(`/api/v1/platform/tenants/${tenantId}/plugins/${pluginKey}/entitlement`);
  }

  tenantPrivatePlugins(): Observable<ApiResponse<{ items: PluginCatalogItem[] }>> {
    return this.api.get<{ items: PluginCatalogItem[] }>('/api/v1/platform/tenant-private-plugins');
  }

  blockTenantPrivate(pluginKey: string, payload: PluginBlockPayload): Observable<ApiResponse<PluginOperationStatus>> {
    return this.api.post<PluginOperationStatus>(
      `/api/v1/platform/tenant-private-plugins/${pluginKey}/block`,
      {
        [ResponseKey.REASON]: payload.reason,
        [ResponseKey.FORCE_UNINSTALL]: payload.force_uninstall,
        confirmations: {
          [ResponseKey.AFFECTED_TENANTS]: payload.confirmations.affected_tenants,
          [ResponseKey.CONFIRM_TEXT]: payload.confirmations.confirm_text
        }
      }
    );
  }

  credentials(): Observable<ApiResponse<{ items: PluginCredentialItem[] }>> {
    return this.api.get<{ items: PluginCredentialItem[] }>('/api/v1/platform/plugin-credentials');
  }

  createCredential(payload: PluginCredentialPayload): Observable<ApiResponse<PluginCredentialItem>> {
    return this.api.post<PluginCredentialItem>('/api/v1/platform/plugin-credentials', {
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.REGISTRY_HOST]: payload.registry_host,
      [ResponseKey.USERNAME]: payload.username,
      [ResponseKey.SECRET]: payload.secret
    });
  }

  updateCredential(id: string, payload: Partial<PluginCredentialPayload>): Observable<ApiResponse<PluginCredentialItem>> {
    return this.api.patch<PluginCredentialItem>(`/api/v1/platform/plugin-credentials/${id}`, {
      [ResponseKey.NAME]: payload.name,
      [ResponseKey.REGISTRY_HOST]: payload.registry_host,
      [ResponseKey.USERNAME]: payload.username,
      [ResponseKey.SECRET]: payload.secret
    });
  }

  deleteCredential(id: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/api/v1/platform/plugin-credentials/${id}`);
  }

  testCredential(id: string): Observable<ApiResponse<{ connected: boolean }>> {
    return this.api.post<{ connected: boolean }>(`/api/v1/platform/plugin-credentials/${id}/test`, {});
  }
}
