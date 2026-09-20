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
}
