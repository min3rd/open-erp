import {
  PluginCatalogStatus,
  PluginCredentialScope,
  PluginDistributionType,
  PluginMigrationPolicy,
  PluginReleaseStatus,
  PluginRollbackStrategy,
  PluginVisibility,
  TenantPluginStatus,
} from '../enums';

export interface PluginCatalogItem {
  plugin_key: string;
  name_key: string;
  description_key: string;
  visibility: PluginVisibility;
  catalog_status: PluginCatalogStatus;
  default_install?: boolean;
  locked?: boolean;
  owner_tenant_id?: string;
  latest_version?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PluginVersionItem {
  version: string;
  release_status: PluginReleaseStatus;
  core_compatibility: string;
  migration_policy: PluginMigrationPolicy;
  rollback_strategy: PluginRollbackStrategy;
  distribution_type: PluginDistributionType;
  image_ref?: string | null;
  digest?: string | null;
  checksum?: string | null;
  artifact_ref?: string | null;
  block_reason?: string | null;
  created_at?: string;
  published_at?: string | null;
}

export interface PluginCatalogDetail
  extends Omit<PluginCatalogItem, 'latest_version'> {
  entitlement_plans?: string[];
  block_reason?: string | null;
  blocked_at?: string | null;
  versions: PluginVersionItem[];
}

export interface PluginMarketplaceItem {
  plugin_key: string;
  name_key: string;
  description_key: string;
  status: TenantPluginStatus;
  installed_version?: string | null;
  latest_version?: string | null;
  update_available?: boolean;
  is_custom?: boolean;
  locked?: boolean;
  catalog_status?: PluginCatalogStatus;
}

export interface PluginOperationStep {
  step: string;
  result: string;
  error_code?: string | null;
}

export interface PluginOperationStatus {
  operation_id: string;
  plugin_key: string;
  operation: string;
  status: string;
  target_version?: string | null;
  steps: PluginOperationStep[];
}

export interface PluginArtifactUploadResult {
  artifact_ref: string;
  checksum: string;
  size_bytes: number;
  file_name: string;
}

export interface PluginActionResult {
  plugin_key: string;
  version?: string;
  release_status?: PluginReleaseStatus;
  catalog_status?: PluginCatalogStatus;
  reason?: string;
  affected_tenants?: number;
}

export interface PluginCredentialItem {
  id: string;
  scope: PluginCredentialScope;
  name: string;
  username: string;
  registry_host: string;
  last_used_at?: string | null;
  connected?: boolean | null;
}

export interface PluginCredentialPayload {
  name: string;
  registry_host: string;
  username: string;
  secret: string;
}
