package com.vn9melody.openerp.modules.plugin.api;

/**
 * Canonical response codes for Plugin Manager APIs (DES-03-API section 6).
 * Success identifiers and i18n keys are resolved on the frontend from these codes;
 * no localized text is ever embedded in API payloads.
 */
public final class PluginErrorCode {
    private PluginErrorCode() {}

    // Success - catalog / versions
    public static final String PLUGIN_LIST_SUCCESS = "PLUGIN_LIST_SUCCESS";
    public static final String PLUGIN_DETAIL_SUCCESS = "PLUGIN_DETAIL_SUCCESS";
    public static final String PLUGIN_REGISTER_SUCCESS = "PLUGIN_REGISTER_SUCCESS";
    public static final String PLUGIN_VERSION_ADD_SUCCESS = "PLUGIN_VERSION_ADD_SUCCESS";
    public static final String PLUGIN_VERSION_LIST_SUCCESS = "PLUGIN_VERSION_LIST_SUCCESS";
    public static final String PLUGIN_ARTIFACT_UPLOAD_SUCCESS = "PLUGIN_ARTIFACT_UPLOAD_SUCCESS";
    public static final String PLUGIN_PUBLISH_SUCCESS = "PLUGIN_PUBLISH_SUCCESS";
    public static final String PLUGIN_DEPRECATE_SUCCESS = "PLUGIN_DEPRECATE_SUCCESS";
    public static final String PLUGIN_BLOCK_STARTED = "PLUGIN_BLOCK_STARTED";
    public static final String PLUGIN_BLOCK_SUCCESS = "PLUGIN_BLOCK_SUCCESS";
    public static final String PLUGIN_UNBLOCK_SUCCESS = "PLUGIN_UNBLOCK_SUCCESS";
    public static final String PLUGIN_VERSION_DELETE_SUCCESS = "PLUGIN_VERSION_DELETE_SUCCESS";
    public static final String PLUGIN_CATALOG_DELETE_SUCCESS = "PLUGIN_CATALOG_DELETE_SUCCESS";
    public static final String PLUGIN_METADATA_UPDATE_SUCCESS = "PLUGIN_METADATA_UPDATE_SUCCESS";

    // Success - entitlements / lifecycle
    public static final String PLUGIN_ENTITLEMENT_GRANT_SUCCESS = "PLUGIN_ENTITLEMENT_GRANT_SUCCESS";
    public static final String PLUGIN_ENTITLEMENT_REVOKE_SUCCESS = "PLUGIN_ENTITLEMENT_REVOKE_SUCCESS";
    public static final String PLUGIN_INSTALLATIONS_LIST_SUCCESS = "PLUGIN_INSTALLATIONS_LIST_SUCCESS";
    public static final String PLUGIN_BULK_APPLY_PREVIEW_SUCCESS = "PLUGIN_BULK_APPLY_PREVIEW_SUCCESS";
    public static final String PLUGIN_BULK_APPLY_STARTED = "PLUGIN_BULK_APPLY_STARTED";
    public static final String PLUGIN_INSTALL_STARTED = "PLUGIN_INSTALL_STARTED";
    public static final String PLUGIN_INSTALL_SUCCESS = "PLUGIN_INSTALL_SUCCESS";
    public static final String PLUGIN_ENABLE_SUCCESS = "PLUGIN_ENABLE_SUCCESS";
    public static final String PLUGIN_DISABLE_SUCCESS = "PLUGIN_DISABLE_SUCCESS";
    public static final String PLUGIN_UPGRADE_STARTED = "PLUGIN_UPGRADE_STARTED";
    public static final String PLUGIN_UPGRADE_SUCCESS = "PLUGIN_UPGRADE_SUCCESS";
    public static final String PLUGIN_UNINSTALL_SUCCESS = "PLUGIN_UNINSTALL_SUCCESS";
    public static final String PLUGIN_ROLLBACK_SUCCESS = "PLUGIN_ROLLBACK_SUCCESS";
    public static final String PLUGIN_MARKETPLACE_LIST_SUCCESS = "PLUGIN_MARKETPLACE_LIST_SUCCESS";
    public static final String PLUGIN_TENANT_PRIVATE_LIST_SUCCESS = "PLUGIN_TENANT_PRIVATE_LIST_SUCCESS";

    // Success - shared / credentials / notifications
    public static final String PLUGIN_OPERATION_STATUS_SUCCESS = "PLUGIN_OPERATION_STATUS_SUCCESS";
    public static final String PLUGIN_UI_MANIFEST_SUCCESS = "PLUGIN_UI_MANIFEST_SUCCESS";
    public static final String PLUGIN_CREDENTIAL_LIST_SUCCESS = "PLUGIN_CREDENTIAL_LIST_SUCCESS";
    public static final String PLUGIN_CREDENTIAL_CREATED = "PLUGIN_CREDENTIAL_CREATED";
    public static final String PLUGIN_CREDENTIAL_UPDATED = "PLUGIN_CREDENTIAL_UPDATED";
    public static final String PLUGIN_CREDENTIAL_DELETED = "PLUGIN_CREDENTIAL_DELETED";
    public static final String PLUGIN_CREDENTIAL_TEST_SUCCESS = "PLUGIN_CREDENTIAL_TEST_SUCCESS";
    public static final String PLUGIN_NOTIFICATION_LIST_SUCCESS = "PLUGIN_NOTIFICATION_LIST_SUCCESS";
    public static final String PLUGIN_NOTIFICATION_READ_SUCCESS = "PLUGIN_NOTIFICATION_READ_SUCCESS";
    public static final String PLUGIN_RUNTIME_SESSION_ISSUED = "PLUGIN_RUNTIME_SESSION_ISSUED";

    // Errors - artifact
    public static final String PLUGIN_ARTIFACT_SOURCE_INVALID = "PLUGIN_ARTIFACT_SOURCE_INVALID";
    public static final String PLUGIN_ARTIFACT_DOWNLOAD_FAILED = "PLUGIN_ARTIFACT_DOWNLOAD_FAILED";
    public static final String PLUGIN_ARTIFACT_INVALID_MANIFEST = "PLUGIN_ARTIFACT_INVALID_MANIFEST";
    public static final String PLUGIN_ARTIFACT_CHECKSUM_MISMATCH = "PLUGIN_ARTIFACT_CHECKSUM_MISMATCH";
    public static final String PLUGIN_ARTIFACT_TOO_LARGE = "PLUGIN_ARTIFACT_TOO_LARGE";
    public static final String PLUGIN_ARTIFACT_NOT_OWNED = "PLUGIN_ARTIFACT_NOT_OWNED";
    public static final String PLUGIN_REGISTRY_NOT_ALLOWED = "PLUGIN_REGISTRY_NOT_ALLOWED";
    public static final String PLUGIN_IMAGE_BUILD_FAILED = "PLUGIN_IMAGE_BUILD_FAILED";

    // Errors - catalog / versions
    public static final String PLUGIN_KEY_ALREADY_EXISTS = "PLUGIN_KEY_ALREADY_EXISTS";
    public static final String PLUGIN_VERSION_ALREADY_EXISTS = "PLUGIN_VERSION_ALREADY_EXISTS";
    public static final String PLUGIN_VERSION_IN_USE = "PLUGIN_VERSION_IN_USE";
    public static final String PLUGIN_CORE_VERSION_INCOMPATIBLE = "PLUGIN_CORE_VERSION_INCOMPATIBLE";
    public static final String PLUGIN_UI_SLOT_NOT_FOUND = "PLUGIN_UI_SLOT_NOT_FOUND";
    public static final String PLUGIN_NOT_FOUND = "PLUGIN_NOT_FOUND";
    public static final String PLUGIN_VERSION_NOT_VERIFIED = "PLUGIN_VERSION_NOT_VERIFIED";

    // Errors - dependency
    public static final String PLUGIN_DEPENDENCY_MISSING = "PLUGIN_DEPENDENCY_MISSING";
    public static final String PLUGIN_DEPENDENCY_CYCLE = "PLUGIN_DEPENDENCY_CYCLE";
    public static final String PLUGIN_HAS_DEPENDENTS = "PLUGIN_HAS_DEPENDENTS";

    // Errors - entitlement / lifecycle
    public static final String PLUGIN_NOT_ENTITLED = "PLUGIN_NOT_ENTITLED";
    public static final String PLUGIN_CUSTOM_NOT_ALLOWED = "PLUGIN_CUSTOM_NOT_ALLOWED";
    public static final String PLUGIN_ALREADY_INSTALLED = "PLUGIN_ALREADY_INSTALLED";
    public static final String PLUGIN_NOT_INSTALLED = "PLUGIN_NOT_INSTALLED";
    public static final String PLUGIN_DISABLED_FOR_TENANT = "PLUGIN_DISABLED_FOR_TENANT";
    public static final String PLUGIN_LOCKED_DEFAULT = "PLUGIN_LOCKED_DEFAULT";
    public static final String PLUGIN_OPERATION_IN_PROGRESS = "PLUGIN_OPERATION_IN_PROGRESS";
    public static final String PLUGIN_OPERATION_RECOVERY_ABANDONED = "PLUGIN_OPERATION_RECOVERY_ABANDONED";
    public static final String PLUGIN_BLOCKED_BY_PLATFORM = "PLUGIN_BLOCKED_BY_PLATFORM";
    public static final String PLUGIN_BLOCK_CONFIRMATION_REQUIRED = "PLUGIN_BLOCK_CONFIRMATION_REQUIRED";

    // Errors - runtime / deploy / snapshots
    public static final String PLUGIN_TENANT_DATASOURCE_FAILED = "PLUGIN_TENANT_DATASOURCE_FAILED";
    public static final String PLUGIN_DEPLOY_FAILED = "PLUGIN_DEPLOY_FAILED";
    public static final String PLUGIN_SERVICE_UNHEALTHY = "PLUGIN_SERVICE_UNHEALTHY";
    public static final String PLUGIN_RUNTIME_UNAVAILABLE = "PLUGIN_RUNTIME_UNAVAILABLE";
    public static final String PLUGIN_RUNTIME_REQUEST_TOO_LARGE = "PLUGIN_RUNTIME_REQUEST_TOO_LARGE";
    public static final String PLUGIN_RUNTIME_TOKEN_INVALID = "PLUGIN_RUNTIME_TOKEN_INVALID";
    public static final String PLUGIN_IN_USE_BY_TENANTS = "PLUGIN_IN_USE_BY_TENANTS";
    public static final String PLUGIN_SNAPSHOT_FAILED = "PLUGIN_SNAPSHOT_FAILED";
    public static final String PLUGIN_SNAPSHOT_REQUIRED = "PLUGIN_SNAPSHOT_REQUIRED";
    public static final String PLUGIN_SNAPSHOT_MISSING = "PLUGIN_SNAPSHOT_MISSING";
    public static final String PLUGIN_RESTORE_SNAPSHOT_FAILED = "PLUGIN_RESTORE_SNAPSHOT_FAILED";

    // Errors - credentials / notifications
    public static final String PLUGIN_CREDENTIAL_NOT_FOUND = "PLUGIN_CREDENTIAL_NOT_FOUND";
    public static final String PLUGIN_CREDENTIAL_DUPLICATE_HOST = "PLUGIN_CREDENTIAL_DUPLICATE_HOST";
    public static final String PLUGIN_CREDENTIAL_IN_USE = "PLUGIN_CREDENTIAL_IN_USE";
    public static final String PLUGIN_CREDENTIAL_AUTH_FAILED = "PLUGIN_CREDENTIAL_AUTH_FAILED";
    public static final String PLUGIN_NOTIFICATION_NOT_FOUND = "PLUGIN_NOTIFICATION_NOT_FOUND";
}
