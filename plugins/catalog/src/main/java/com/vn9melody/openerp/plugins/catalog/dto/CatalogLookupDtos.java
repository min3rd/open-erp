package com.vn9melody.openerp.plugins.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.plugins.catalog.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogResponseKey;
import java.util.List;
import java.util.UUID;

/**
 * Typed DTOs of the dynamic-form lookup APIs (DES-API-S05-001 section 4/5):
 * types schema, merged options, batch resolve and inline quick-create.
 */
public final class CatalogLookupDtos {

    private CatalogLookupDtos() {
    }

    /** Schema row consumed by the form renderer (DES-API section 5.1). */
    public record LookupTypeResponse(
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(CatalogResponseKey.Json.NAME_KEY) String nameKey,
        @JsonProperty(CatalogResponseKey.Json.ALLOW_FREE_TEXT) boolean allowFreeText,
        @JsonProperty(CatalogResponseKey.Json.HIERARCHY_MODE) String hierarchyMode,
        @JsonProperty(CatalogResponseKey.Json.PARENT_TYPE_CODE) String parentTypeCode,
        @JsonProperty(CatalogResponseKey.Json.MULTIPLE) boolean multiple,
        @JsonProperty(CatalogResponseKey.Json.ATTRIBUTES_SCHEMA) JsonNode attributesSchema
    ) {
    }

    /**
     * One option row of {@code GET /catalog/lookup/{typeCode}/options}
     * (contract pinned by the shared catalog-picker: id, code, name, parent_id,
     * path, has_children, is_system, overridden, allow_free_text).
     */
    public record OptionResponse(
        @JsonProperty(ResponseKey.Json.ID) UUID id,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(ResponseKey.Json.PARENT_ID) UUID parentId,
        @JsonProperty(CatalogResponseKey.Json.PATH) String path,
        @JsonProperty(CatalogResponseKey.Json.HAS_CHILDREN) boolean hasChildren,
        @JsonProperty(ResponseKey.Json.IS_SYSTEM) boolean isSystem,
        @JsonProperty(CatalogResponseKey.Json.OVERRIDDEN) boolean overridden,
        @JsonProperty(CatalogResponseKey.Json.ALLOW_FREE_TEXT) boolean allowFreeText
    ) {
    }

    public record ResolveRequest(
        @JsonProperty(CatalogResponseKey.Json.IDS) List<String> ids
    ) {
    }

    public record InlineCreateRequest(
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(ResponseKey.Json.CODE) String code
    ) {
    }
}
