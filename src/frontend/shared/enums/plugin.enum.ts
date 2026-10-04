/**
 * Plugin Manager enums (Sprint 03 - DES-03-DB section 3).
 * Mirror 1-1 with Java enums in com.vn9melody.openerp.core.enums.
 */

export enum PluginVisibility {
  PLATFORM = 'PLATFORM',
  TENANT_PRIVATE = 'TENANT_PRIVATE',
}

export enum PluginCatalogStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum PluginReleaseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
  BLOCKED = 'BLOCKED',
}

export enum TenantPluginStatus {
  NOT_INSTALLED = 'NOT_INSTALLED',
  INSTALLING = 'INSTALLING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UPGRADING = 'UPGRADING',
  INSTALL_FAILED = 'INSTALL_FAILED',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  UNINSTALLING = 'UNINSTALLING',
  UNINSTALLED = 'UNINSTALLED',
}

export enum PluginDistributionType {
  DOCKER_HUB = 'DOCKER_HUB',
  IMAGE_REGISTRY = 'IMAGE_REGISTRY',
  JAR_BUNDLE = 'JAR_BUNDLE',
}

export enum PluginRenderMode {
  WEB_COMPONENT = 'WEB_COMPONENT',
  MODULE_FEDERATION = 'MODULE_FEDERATION',
  IFRAME = 'IFRAME',
}

export enum PluginRollbackStrategy {
  SNAPSHOT_RESTORE = 'SNAPSHOT_RESTORE',
  DOWN_MIGRATION = 'DOWN_MIGRATION',
}

export enum PluginMigrationPolicy {
  COMPATIBLE = 'COMPATIBLE',
  BREAKING = 'BREAKING',
}

export enum PluginCredentialScope {
  PLATFORM = 'PLATFORM',
  TENANT = 'TENANT',
}
