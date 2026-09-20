package com.vn9melody.openerp.modules.plugin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.modules.plugin.api.PluginResponseKey;
import java.time.Instant;
import java.util.List;

/** Typed response payloads for the Plugin Manager APIs (no free-form maps). */
public final class PluginResponses {

    private PluginResponses() {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CatalogItem {
        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        @JsonProperty(PluginResponseKey.Json.NAME_KEY)
        public String nameKey;

        @JsonProperty(PluginResponseKey.Json.DESCRIPTION_KEY)
        public String descriptionKey;

        @JsonProperty(PluginResponseKey.Json.VISIBILITY)
        public String visibility;

        @JsonProperty(PluginResponseKey.Json.CATALOG_STATUS)
        public String catalogStatus;

        @JsonProperty(PluginResponseKey.Json.DEFAULT_INSTALL)
        public Boolean defaultInstall;

        @JsonProperty(PluginResponseKey.Json.LOCKED)
        public Boolean locked;

        @JsonProperty(PluginResponseKey.Json.OWNER_TENANT_ID)
        public String ownerTenantId;

        @JsonProperty(PluginResponseKey.Json.LATEST_VERSION)
        public String latestVersion;

        @JsonProperty(PluginResponseKey.Json.CREATED_AT)
        public Instant createdAt;

        @JsonProperty(PluginResponseKey.Json.UPDATED_AT)
        public Instant updatedAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CatalogDetail {
        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        @JsonProperty(PluginResponseKey.Json.NAME_KEY)
        public String nameKey;

        @JsonProperty(PluginResponseKey.Json.DESCRIPTION_KEY)
        public String descriptionKey;

        @JsonProperty(PluginResponseKey.Json.VISIBILITY)
        public String visibility;

        @JsonProperty(PluginResponseKey.Json.CATALOG_STATUS)
        public String catalogStatus;

        @JsonProperty(PluginResponseKey.Json.DEFAULT_INSTALL)
        public Boolean defaultInstall;

        @JsonProperty(PluginResponseKey.Json.LOCKED)
        public Boolean locked;

        @JsonProperty(PluginResponseKey.Json.OWNER_TENANT_ID)
        public String ownerTenantId;

        @JsonProperty(PluginResponseKey.Json.ENTITLEMENT_PLANS)
        public List<String> entitlementPlans;

        @JsonProperty(PluginResponseKey.Json.BLOCK_REASON)
        public String blockReason;

        @JsonProperty(PluginResponseKey.Json.BLOCKED_AT)
        public Instant blockedAt;

        @JsonProperty(PluginResponseKey.Json.CREATED_AT)
        public Instant createdAt;

        @JsonProperty(PluginResponseKey.Json.UPDATED_AT)
        public Instant updatedAt;

        @JsonProperty(PluginResponseKey.Json.VERSION)
        public List<VersionItem> versions;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class VersionItem {
        @JsonProperty(PluginResponseKey.Json.VERSION)
        public String version;

        @JsonProperty(PluginResponseKey.Json.RELEASE_STATUS)
        public String releaseStatus;

        @JsonProperty(PluginResponseKey.Json.CORE_COMPATIBILITY)
        public String coreCompatibility;

        @JsonProperty(PluginResponseKey.Json.MIGRATION_POLICY)
        public String migrationPolicy;

        @JsonProperty(PluginResponseKey.Json.ROLLBACK_STRATEGY)
        public String rollbackStrategy;

        @JsonProperty(PluginResponseKey.Json.DISTRIBUTION_TYPE)
        public String distributionType;

        @JsonProperty(PluginResponseKey.Json.IMAGE_REF)
        public String imageRef;

        @JsonProperty(PluginResponseKey.Json.DIGEST)
        public String digest;

        @JsonProperty(PluginResponseKey.Json.CHECKSUM)
        public String checksum;

        @JsonProperty(PluginResponseKey.Json.ARTIFACT_REF)
        public String artifactRef;

        @JsonProperty(PluginResponseKey.Json.BLOCK_REASON)
        public String blockReason;

        @JsonProperty(PluginResponseKey.Json.CREATED_AT)
        public Instant createdAt;

        @JsonProperty(PluginResponseKey.Json.PUBLISHED_AT)
        public Instant publishedAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ActionResult {
        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        @JsonProperty(PluginResponseKey.Json.VERSION)
        public String version;

        @JsonProperty(PluginResponseKey.Json.RELEASE_STATUS)
        public String releaseStatus;

        @JsonProperty(PluginResponseKey.Json.CATALOG_STATUS)
        public String catalogStatus;

        @JsonProperty(PluginResponseKey.Json.REASON)
        public String reason;

        @JsonProperty(PluginResponseKey.Json.AFFECTED_TENANTS)
        public Integer affectedTenants;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UploadResult {
        @JsonProperty(PluginResponseKey.Json.ARTIFACT_REF)
        public String artifactRef;

        @JsonProperty(PluginResponseKey.Json.CHECKSUM)
        public String checksum;

        @JsonProperty(PluginResponseKey.Json.SIZE_BYTES)
        public Long sizeBytes;

        @JsonProperty(PluginResponseKey.Json.FILE_NAME)
        public String fileName;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MarketplaceItem {
        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        @JsonProperty(PluginResponseKey.Json.NAME_KEY)
        public String nameKey;

        @JsonProperty(PluginResponseKey.Json.DESCRIPTION_KEY)
        public String descriptionKey;

        @JsonProperty(PluginResponseKey.Json.STATUS)
        public String status;

        @JsonProperty(PluginResponseKey.Json.INSTALLED_VERSION)
        public String installedVersion;

        @JsonProperty(PluginResponseKey.Json.LATEST_VERSION)
        public String latestVersion;

        @JsonProperty(PluginResponseKey.Json.UPDATE_AVAILABLE)
        public Boolean updateAvailable;

        @JsonProperty(PluginResponseKey.Json.IS_CUSTOM)
        public Boolean isCustom;

        @JsonProperty(PluginResponseKey.Json.LOCKED)
        public Boolean locked;

        @JsonProperty(PluginResponseKey.Json.CATALOG_STATUS)
        public String catalogStatus;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OperationStep {
        public String step;
        public String result;
        public String errorCode;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UiHost {
        public String type;

        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        @JsonProperty(PluginResponseKey.Json.INSTALLED_VERSION)
        public String installedVersion;

        @JsonProperty(PluginResponseKey.Json.CONTRACT_VERSION)
        public String contractVersion;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UiContribution {
        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        @JsonProperty(PluginResponseKey.Json.TITLE_KEY)
        public String titleKey;

        @JsonProperty(PluginResponseKey.Json.RENDER_MODE)
        public String renderMode;

        @JsonProperty(PluginResponseKey.Json.ENTRY)
        public String entry;

        @JsonProperty(PluginResponseKey.Json.PERMISSION)
        public String permission;

        @JsonProperty(PluginResponseKey.Json.ORDER)
        public Integer order;

        @JsonProperty(PluginResponseKey.Json.CONTRACT_VERSION)
        public String contractVersion;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UiSlot {
        @JsonProperty(PluginResponseKey.Json.SLOT_CODE)
        public String slotCode;

        @JsonProperty(PluginResponseKey.Json.HOST)
        public UiHost host;

        @JsonProperty(PluginResponseKey.Json.CONTRIBUTIONS)
        public List<UiContribution> contributions;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UiScreen {
        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        @JsonProperty(PluginResponseKey.Json.ROUTE)
        public String route;

        @JsonProperty(PluginResponseKey.Json.TITLE_KEY)
        public String titleKey;

        @JsonProperty(PluginResponseKey.Json.PERMISSION)
        public String permission;

        @JsonProperty(PluginResponseKey.Json.ORDER)
        public Integer order;

        @JsonProperty(PluginResponseKey.Json.RENDER_MODE)
        public String renderMode;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UiManifest {
        @JsonProperty(PluginResponseKey.Json.SCREENS)
        public List<UiScreen> screens;

        @JsonProperty(PluginResponseKey.Json.SLOTS)
        public List<UiSlot> slots;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class NotificationItem {
        public String id;

        @JsonProperty(PluginResponseKey.Json.NOTIFICATION_TYPE)
        public String type;

        @JsonProperty(PluginResponseKey.Json.TITLE_KEY)
        public String titleKey;

        @JsonProperty(PluginResponseKey.Json.SEVERITY)
        public String severity;

        @JsonProperty(PluginResponseKey.Json.READ_AT)
        public Instant readAt;

        @JsonProperty(PluginResponseKey.Json.CREATED_AT)
        public Instant createdAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BulkPreview {
        @JsonProperty(PluginResponseKey.Json.TOTAL)
        public Integer total;

        @JsonProperty(PluginResponseKey.Json.TENANT_IDS)
        public List<String> tenantIds;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BulkReport {
        @JsonProperty(PluginResponseKey.Json.REQUESTED)
        public Integer requested;

        @JsonProperty(PluginResponseKey.Json.SUCCEEDED)
        public Integer succeeded;

        @JsonProperty(PluginResponseKey.Json.FAILED)
        public Integer failed;

        @JsonProperty(PluginResponseKey.Json.ERRORS)
        public List<String> errors;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CredentialItem {
        @JsonProperty(PluginResponseKey.Json.ID)
        public String id;

        @JsonProperty(PluginResponseKey.Json.SCOPE)
        public String scope;

        @JsonProperty(PluginResponseKey.Json.NAME)
        public String name;

        @JsonProperty(PluginResponseKey.Json.REGISTRY_HOST)
        public String registryHost;

        @JsonProperty(PluginResponseKey.Json.USERNAME)
        public String username;

        @JsonProperty(PluginResponseKey.Json.LAST_USED_AT)
        public Instant lastUsedAt;

        @JsonProperty(PluginResponseKey.Json.CONNECTED)
        public Boolean connected;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OperationStatus {
        @JsonProperty(PluginResponseKey.Json.OPERATION_ID)
        public String operationId;

        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        public String operation;

        @JsonProperty(PluginResponseKey.Json.STATUS)
        public String status;

        @JsonProperty(PluginResponseKey.Json.TARGET_VERSION)
        public String targetVersion;

        @JsonProperty(PluginResponseKey.Json.STEPS)
        public List<OperationStep> steps;
    }
}
