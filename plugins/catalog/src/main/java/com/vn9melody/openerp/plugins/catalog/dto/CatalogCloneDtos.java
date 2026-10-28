package com.vn9melody.openerp.plugins.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugins.catalog.api.CatalogResponseKey;
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
}
