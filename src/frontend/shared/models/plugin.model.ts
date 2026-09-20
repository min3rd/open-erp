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
  version: PluginVersionItem[];
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

export interface PluginNotification {
  id: string;
  type: string;
  title_key: string;
  severity: string;
  read_at?: string | null;
  created_at?: string;
}

export interface PluginNotificationList {
  items: PluginNotification[];
}

export interface PluginInstallationItem {
  tenant_id: string;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  status: string;
  installed_version?: string | null;
  target_version?: string | null;
  storage_schema?: string | null;
  last_error_code?: string | null;
}

export interface PluginRegisterCatalogPayload {
  plugin_key: string;
  name_key: string;
  description_key: string;
  entitlement_plans?: string[];
  default_install?: boolean;
  locked?: boolean;
}

export interface PluginUpdateCatalogPayload {
  name_key?: string;
  description_key?: string;
  entitlement_plans?: string[];
  default_install?: boolean;
  locked?: boolean;
}

export interface PluginRegisterVersionPayload {
  source: string;
  version: string;
  manifest?: unknown;
  image_ref?: string;
  registry_url?: string;
  repository?: string;
  tag?: string;
  digest?: string;
  checksum?: string;
  artifact_ref?: string;
}

export interface PluginBlockPayload {
  reason: string;
  scope: string;
  version?: string | null;
  force_uninstall: boolean;
  confirmations: {
    affected_tenants: number;
    confirm_text: string;
  };
}

export interface PluginBulkPreview {
  total: number;
  tenant_ids: string[];
}

export interface PluginBulkApplyPayload {
  preview_token: string;
  version: string;
  tenant_ids?: string[];
}

export interface PluginBulkReport {
  requested: number;
  succeeded: number;
  failed: number;
  errors: string[];
}
