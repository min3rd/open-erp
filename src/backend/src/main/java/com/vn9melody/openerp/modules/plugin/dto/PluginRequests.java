package com.vn9melody.openerp.modules.plugin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.modules.plugin.api.PluginResponseKey;
import java.util.List;

public class PluginRequests {

    public static class RegisterCatalog {
        @JsonProperty(PluginResponseKey.Json.PLUGIN_KEY)
        public String pluginKey;

        @JsonProperty(PluginResponseKey.Json.NAME_KEY)
        public String nameKey;

        @JsonProperty(PluginResponseKey.Json.DESCRIPTION_KEY)
        public String descriptionKey;

        @JsonProperty(PluginResponseKey.Json.ENTITLEMENT_PLANS)
        public List<String> entitlementPlans;

        @JsonProperty(PluginResponseKey.Json.DEFAULT_INSTALL)
        public Boolean defaultInstall;

        @JsonProperty(PluginResponseKey.Json.LOCKED)
        public Boolean locked;
    }

    public static class UpdateCatalog {
        @JsonProperty(PluginResponseKey.Json.NAME_KEY)
        public String nameKey;

        @JsonProperty(PluginResponseKey.Json.DESCRIPTION_KEY)
        public String descriptionKey;

        @JsonProperty(PluginResponseKey.Json.ENTITLEMENT_PLANS)
        public List<String> entitlementPlans;

        @JsonProperty(PluginResponseKey.Json.DEFAULT_INSTALL)
        public Boolean defaultInstall;

        @JsonProperty(PluginResponseKey.Json.LOCKED)
        public Boolean locked;
    }

    public static class RegisterVersion {
        public String source;

        @JsonProperty(PluginResponseKey.Json.VERSION)
        public String version;

        public JsonNode manifest;

        @JsonProperty(PluginResponseKey.Json.IMAGE_REF)
        public String imageRef;

        @JsonProperty(PluginResponseKey.Json.REGISTRY_HOST)
        public String registryUrl;

        public String repository;
        public String tag;

        @JsonProperty(PluginResponseKey.Json.DIGEST)
        public String digest;

        @JsonProperty(PluginResponseKey.Json.CHECKSUM)
        public String checksum;

        @JsonProperty(PluginResponseKey.Json.ARTIFACT_REF)
        public String artifactRef;

        @JsonProperty(PluginResponseKey.Json.TEMPLATE_VERSION)
        public String templateVersion;
    }

    public static class VersionAction {
        public String action;
        public String reason;
    }

    public static class Block {
        public String reason;
        public String scope;

        @JsonProperty(PluginResponseKey.Json.VERSION)
        public String version;

        @JsonProperty(PluginResponseKey.Json.FORCE_UNINSTALL)
        public Boolean forceUninstall;

        public Confirmations confirmations;

        public static class Confirmations {
            @JsonProperty(PluginResponseKey.Json.AFFECTED_TENANTS)
            public Integer affectedTenants;

            @JsonProperty(PluginResponseKey.Json.CONFIRM_TEXT)
            public String confirmText;
        }
    }

    public static class Reason {
        public String reason;
    }

    public static class Install {
        @JsonProperty(PluginResponseKey.Json.VERSION)
        public String version;
    }

    public static class PlatformLifecycle {
        @JsonProperty(PluginResponseKey.Json.VERSION)
        public String version;

        public String reason;
    }

    public static class Upgrade {
        @JsonProperty(PluginResponseKey.Json.TARGET_VERSION)
        public String targetVersion;

        public Boolean snapshot;
        public String reason;
    }

    public static class Rollback {
        @JsonProperty(PluginResponseKey.Json.TARGET_VERSION)
        public String targetVersion;

        @JsonProperty("restore_snapshot")
        public Boolean restoreSnapshot;

        public String reason;
    }

    public static class BulkApply {
        @JsonProperty(PluginResponseKey.Json.TENANT_IDS)
        public List<String> tenantIds;

        @JsonProperty(PluginResponseKey.Json.TARGET_VERSION)
        public String targetVersion;

        public String reason;
    }
}
