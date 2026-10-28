package com.vn9melody.openerp.plugins.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogResponseKey;
import java.util.List;
import java.util.UUID;

/** Response of a clone / delete-clone operation (FEAT-32). */
public final class CatalogCloneDtos {

    private CatalogCloneDtos() {
    }

    public record CloneResult(
        @JsonProperty(CatalogResponseKey.Json.TYPES) int types,
        @JsonProperty(CatalogResponseKey.Json.ITEMS) int items,
        @JsonProperty(CatalogResponseKey.Json.EDGES) int edges,
        @JsonProperty(CatalogResponseKey.Json.RELATIONS) int relations,
        @JsonProperty(CatalogResponseKey.Json.SKIPPED) int skipped,
        @JsonProperty(CatalogResponseKey.Json.TENANT_TYPE_ID) UUID tenantTypeId
    ) {
    }

    public record SyncConflict(
        @JsonProperty(CatalogResponseKey.Json.SCOPE) String scope,
        @JsonProperty(CatalogResponseKey.Json.KEY) String key,
        @JsonProperty(CatalogResponseKey.Json.FIELD) String field,
        @JsonProperty(CatalogResponseKey.Json.TENANT) Object tenant,
        @JsonProperty(CatalogResponseKey.Json.SYSTEM) Object system,
        @JsonProperty(CatalogResponseKey.Json.DEFAULT_ACTION) String defaultAction
    ) {
    }

    public record SyncPreview(
        @JsonProperty(CatalogResponseKey.Json.CONFLICTS) List<SyncConflict> conflicts
    ) {
    }

    public record SyncAction(
        @JsonProperty(CatalogResponseKey.Json.SCOPE) String scope,
        @JsonProperty(CatalogResponseKey.Json.KEY) String key,
        @JsonProperty(CatalogResponseKey.Json.FIELD) String field,
        @JsonProperty(CatalogResponseKey.Json.ACTION) String action
    ) {
    }

    public record SyncApplyRequest(
        @JsonProperty(CatalogResponseKey.Json.CONFLICTS) List<SyncAction> conflicts
    ) {
    }

    public record SyncApplyResult(
        @JsonProperty(CatalogResponseKey.Json.APPLIED) int applied,
        @JsonProperty(CatalogResponseKey.Json.SKIPPED) int skipped,
        @JsonProperty(CatalogResponseKey.Json.CONFLICTS) List<SyncConflict> conflicts
    ) {
    }

    public record PlatformSyncRequest(
        @JsonProperty(CatalogResponseKey.Json.TENANT_ID) UUID tenantId,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(CatalogResponseKey.Json.CONFLICTS) List<SyncAction> conflicts
    ) {
    }
}
