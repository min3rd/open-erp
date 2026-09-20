package com.vn9melody.openerp.modules.plugin.api;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Type-safe payload keys for the Plugin Manager APIs (DES-03-API section 2).
 * All fields returned under the {@code data} map must use these constants
 * (AGENTS.md: zero hardcoded payload keys).
 */
public enum PluginResponseKey {
    // Shared
    PLUGIN_KEY("plugin_key"),
    TENANT_ID("tenant_id"),
    NAME_KEY("name_key"),
    DESCRIPTION_KEY("description_key"),
    VISIBILITY("visibility"),
    CATALOG_STATUS("catalog_status"),
    DEFAULT_INSTALL("default_install"),
    LOCKED("locked"),
    ENTITLEMENT_PLANS("entitlement_plans"),
    CREATED_AT("created_at"),
    UPDATED_AT("updated_at"),

    // Versions
    VERSION("version"),
    RELEASE_STATUS("release_status"),
    CORE_COMPATIBILITY("core_compatibility"),
    MIGRATION_POLICY("migration_policy"),
    ROLLBACK_STRATEGY("rollback_strategy"),
    DEPENDENCIES("dependencies"),
    PLATFORMS("platforms"),
    PERMISSIONS("permissions"),
    ENTITIES("entities"),
    UI_MANIFEST("ui_manifest"),
    DISTRIBUTION_TYPE("distribution_type"),
    IMAGE_REF("image_ref"),
    DIGEST("digest"),
    CHECKSUM("checksum"),
    ARTIFACT_REF("artifact_ref"),
    SNAPSHOT_REF("snapshot_ref"),

    // Tenant ledger / lifecycle
    STATUS("status"),
    INSTALLED_VERSION("installed_version"),
    LATEST_VERSION("latest_version"),
    TARGET_VERSION("target_version"),
    UPDATE_AVAILABLE("update_available"),
    IS_CUSTOM("is_custom"),
    OWNER_TENANT_ID("owner_tenant_id"),
    FORCE_UNINSTALL("force_uninstall"),
    CONFIRM_TEXT("confirm_text"),
    PUBLISHED_AT("published_at"),
    BLOCK_REASON("block_reason"),
    BLOCKED_AT("blocked_at"),
    SIZE_BYTES("size_bytes"),
    FILE_NAME("file_name"),
    TENANT_IDS("tenant_ids"),
    REQUESTED("requested"),
    SUCCEEDED("succeeded"),
    FAILED("failed"),
    ERRORS("errors"),
    TOTAL("total"),
    STORAGE_MODEL("storage_model"),
    STORAGE_SCHEMA("storage_schema"),
    OPERATION_ID("operation_id"),
    STEPS("steps"),
    AFFECTED_TENANTS("affected_tenants"),
    REASON("reason"),
    REMOVAL_PLAN("removal_plan"),

    // UI host
    RENDER_MODE("render_mode"),
    SLOT_CODE("slot_code"),
    CONTRACT_VERSION("contract_version"),
    HOST("host"),
    CONTRIBUTIONS("contributions"),
    SCREENS("screens"),
    SLOTS("slots"),
    ENTRY("entry"),
    ORDER("order"),
    PERMISSION("permission"),
    TITLE_KEY("title_key"),
    ROUTE("route"),

    // Credentials / notifications
    SCOPE("scope"),
    ID("id"),
    REGISTRY_HOST("registry_host"),
    USERNAME("username"),
    NAME("name"),
    LAST_USED_AT("last_used_at"),
    CONNECTED("connected"),
    TEMPLATE_VERSION("template_version"),
    NOTIFICATION_TYPE("type"),
    SEVERITY("severity"),
    READ_AT("read_at"),
    UNREAD_COUNT("unread_count");

    public interface Json {
        String PLUGIN_KEY = "plugin_key";
        String TENANT_ID = "tenant_id";
        String NAME_KEY = "name_key";
        String DESCRIPTION_KEY = "description_key";
        String VISIBILITY = "visibility";
        String CATALOG_STATUS = "catalog_status";
        String DEFAULT_INSTALL = "default_install";
        String LOCKED = "locked";
        String ENTITLEMENT_PLANS = "entitlement_plans";
        String CREATED_AT = "created_at";
        String UPDATED_AT = "updated_at";
        String VERSION = "version";
        String RELEASE_STATUS = "release_status";
        String CORE_COMPATIBILITY = "core_compatibility";
        String MIGRATION_POLICY = "migration_policy";
        String ROLLBACK_STRATEGY = "rollback_strategy";
        String DEPENDENCIES = "dependencies";
        String PLATFORMS = "platforms";
        String PERMISSIONS = "permissions";
        String ENTITIES = "entities";
        String UI_MANIFEST = "ui_manifest";
        String DISTRIBUTION_TYPE = "distribution_type";
        String IMAGE_REF = "image_ref";
        String DIGEST = "digest";
        String CHECKSUM = "checksum";
        String ARTIFACT_REF = "artifact_ref";
        String SNAPSHOT_REF = "snapshot_ref";
        String STATUS = "status";
        String INSTALLED_VERSION = "installed_version";
        String LATEST_VERSION = "latest_version";
        String TARGET_VERSION = "target_version";
        String UPDATE_AVAILABLE = "update_available";
        String IS_CUSTOM = "is_custom";
        String OWNER_TENANT_ID = "owner_tenant_id";
        String FORCE_UNINSTALL = "force_uninstall";
        String CONFIRM_TEXT = "confirm_text";
        String PUBLISHED_AT = "published_at";
        String BLOCK_REASON = "block_reason";
        String BLOCKED_AT = "blocked_at";
        String SIZE_BYTES = "size_bytes";
        String FILE_NAME = "file_name";
        String TENANT_IDS = "tenant_ids";
        String REQUESTED = "requested";
        String SUCCEEDED = "succeeded";
        String FAILED = "failed";
        String ERRORS = "errors";
        String TOTAL = "total";
        String STORAGE_MODEL = "storage_model";
        String STORAGE_SCHEMA = "storage_schema";
        String OPERATION_ID = "operation_id";
        String STEPS = "steps";
        String AFFECTED_TENANTS = "affected_tenants";
        String REASON = "reason";
        String REMOVAL_PLAN = "removal_plan";
        String RENDER_MODE = "render_mode";
        String SLOT_CODE = "slot_code";
        String CONTRACT_VERSION = "contract_version";
        String HOST = "host";
        String CONTRIBUTIONS = "contributions";
        String SCREENS = "screens";
        String SLOTS = "slots";
        String ENTRY = "entry";
        String ORDER = "order";
        String PERMISSION = "permission";
        String TITLE_KEY = "title_key";
        String ROUTE = "route";
        String SCOPE = "scope";
        String ID = "id";
        String REGISTRY_HOST = "registry_host";
        String USERNAME = "username";
        String NAME = "name";
        String LAST_USED_AT = "last_used_at";
        String CONNECTED = "connected";
        String TEMPLATE_VERSION = "template_version";
        String NOTIFICATION_TYPE = "type";
        String SEVERITY = "severity";
        String READ_AT = "read_at";
        String UNREAD_COUNT = "unread_count";
    }

    private final String key;

    PluginResponseKey(String key) {
        this.key = key;
    }

    @JsonValue
    public String getKey() {
        return key;
    }

    @Override
    public String toString() {
        return key;
    }
}
