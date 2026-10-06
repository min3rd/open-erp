package com.vn9melody.openerp.modules.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.modules.catalog.api.CatalogResponseKey;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Typed request/response DTOs of the catalog type + grant APIs (DES-API-S05-001 section 2). */
public final class CatalogTypeDtos {

    private CatalogTypeDtos() {
    }

    public record TypeResponse(
        @JsonProperty(ResponseKey.Json.ID) UUID id,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(CatalogResponseKey.Json.NAME_KEY) String nameKey,
        @JsonProperty(ResponseKey.Json.DESCRIPTION_KEY) String descriptionKey,
        @JsonProperty(CatalogResponseKey.Json.HIERARCHY_MODE) String hierarchyMode,
        @JsonProperty(CatalogResponseKey.Json.ALLOWED_RELATIONS) List<String> allowedRelations,
        @JsonProperty(CatalogResponseKey.Json.ALLOWED_PARENT_TYPES) List<String> allowedParentTypes,
        @JsonProperty(CatalogResponseKey.Json.MAX_DEPTH) Integer maxDepth,
        @JsonProperty(CatalogResponseKey.Json.MIN_PARENTS) int minParents,
        @JsonProperty(CatalogResponseKey.Json.ALLOW_FREE_TEXT) boolean allowFreeText,
        @JsonProperty(CatalogResponseKey.Json.VERSIONED) boolean versioned,
        @JsonProperty(CatalogResponseKey.Json.EFFECTIVE_DATED) boolean effectiveDated,
        @JsonProperty(CatalogResponseKey.Json.ATTRIBUTES_SCHEMA) JsonNode attributesSchema,
        @JsonProperty(ResponseKey.Json.STATUS) String status,
        @JsonProperty(ResponseKey.Json.IS_SYSTEM) boolean isSystem,
        @JsonProperty(CatalogResponseKey.Json.CREATED_AT) Instant createdAt,
        @JsonProperty(CatalogResponseKey.Json.UPDATED_AT) Instant updatedAt
    ) {
    }

    public record TypeCreateRequest(
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(CatalogResponseKey.Json.NAME_KEY) String nameKey,
        @JsonProperty(ResponseKey.Json.DESCRIPTION_KEY) String descriptionKey,
        @JsonProperty(CatalogResponseKey.Json.HIERARCHY_MODE) String hierarchyMode,
        @JsonProperty(CatalogResponseKey.Json.ALLOWED_RELATIONS) List<String> allowedRelations,
        @JsonProperty(CatalogResponseKey.Json.ALLOWED_PARENT_TYPES) List<String> allowedParentTypes,
        @JsonProperty(CatalogResponseKey.Json.MAX_DEPTH) Integer maxDepth,
        @JsonProperty(CatalogResponseKey.Json.MIN_PARENTS) Integer minParents,
        @JsonProperty(CatalogResponseKey.Json.ALLOW_FREE_TEXT) Boolean allowFreeText,
        @JsonProperty(CatalogResponseKey.Json.VERSIONED) Boolean versioned,
        @JsonProperty(CatalogResponseKey.Json.EFFECTIVE_DATED) Boolean effectiveDated,
        @JsonProperty(CatalogResponseKey.Json.ATTRIBUTES_SCHEMA) JsonNode attributesSchema,
        @JsonProperty(ResponseKey.Json.STATUS) String status
    ) {
    }

    /** Update never changes {@code code} (DES-API section 2). */
    public record TypeUpdateRequest(
        @JsonProperty(CatalogResponseKey.Json.NAME_KEY) String nameKey,
        @JsonProperty(ResponseKey.Json.DESCRIPTION_KEY) String descriptionKey,
        @JsonProperty(CatalogResponseKey.Json.HIERARCHY_MODE) String hierarchyMode,
        @JsonProperty(CatalogResponseKey.Json.ALLOWED_RELATIONS) List<String> allowedRelations,
        @JsonProperty(CatalogResponseKey.Json.ALLOWED_PARENT_TYPES) List<String> allowedParentTypes,
        @JsonProperty(CatalogResponseKey.Json.MAX_DEPTH) Integer maxDepth,
        @JsonProperty(CatalogResponseKey.Json.MIN_PARENTS) Integer minParents,
        @JsonProperty(CatalogResponseKey.Json.ALLOW_FREE_TEXT) Boolean allowFreeText,
        @JsonProperty(CatalogResponseKey.Json.VERSIONED) Boolean versioned,
        @JsonProperty(CatalogResponseKey.Json.EFFECTIVE_DATED) Boolean effectiveDated,
        @JsonProperty(CatalogResponseKey.Json.ATTRIBUTES_SCHEMA) JsonNode attributesSchema,
        @JsonProperty(ResponseKey.Json.STATUS) String status
    ) {
    }

    public record GrantItem(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @JsonProperty(CatalogResponseKey.Json.CAN_READ) Boolean canRead,
        @JsonProperty(CatalogResponseKey.Json.CAN_WRITE) Boolean canWrite
    ) {
    }

    public record GrantReplaceRequest(
        @JsonProperty(CatalogResponseKey.Json.GRANTS) List<GrantItem> grants
    ) {
    }

    public record GrantResponse(
        @JsonProperty(ResponseKey.Json.ID) UUID id,
        @JsonProperty(ResponseKey.Json.ROLE_ID) UUID roleId,
        @JsonProperty(ResponseKey.Json.ROLE_CODE) String roleCode,
        @JsonProperty(CatalogResponseKey.Json.CAN_READ) boolean canRead,
        @JsonProperty(CatalogResponseKey.Json.CAN_WRITE) boolean canWrite
    ) {
    }
}
