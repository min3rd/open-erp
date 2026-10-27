package com.vn9melody.openerp.plugins.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.plugins.catalog.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogResponseKey;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Typed request/response DTOs of the catalog item + edge APIs (DES-API-S05-001 section 3). */
public final class CatalogItemDtos {

    private CatalogItemDtos() {
    }

    public record ItemResponse(
        @JsonProperty(ResponseKey.Json.ID) UUID id,
        @JsonProperty(CatalogResponseKey.Json.TYPE_ID) UUID typeId,
        @JsonProperty(CatalogResponseKey.Json.TYPE_CODE) String typeCode,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(CatalogResponseKey.Json.NAME_EN) String nameEn,
        @JsonProperty(ResponseKey.Json.DESCRIPTION) String description,
        @JsonProperty(CatalogResponseKey.Json.ATTRIBUTES) JsonNode attributes,
        @JsonProperty(CatalogResponseKey.Json.SORT_ORDER) int sortOrder,
        @JsonProperty(ResponseKey.Json.STATUS) String status,
        @JsonProperty(CatalogResponseKey.Json.VERSION) int version,
        @JsonProperty(CatalogResponseKey.Json.VERSION_GROUP_ID) UUID versionGroupId,
        @JsonProperty(CatalogResponseKey.Json.VALID_FROM) Instant validFrom,
        @JsonProperty(CatalogResponseKey.Json.VALID_TO) Instant validTo,
        @JsonProperty(CatalogResponseKey.Json.SUPERSEDES_ITEM_ID) UUID supersedesItemId,
        @JsonProperty(ResponseKey.Json.IS_SYSTEM) boolean isSystem,
        @JsonProperty(CatalogResponseKey.Json.OVERRIDDEN) boolean overridden,
        @JsonProperty(CatalogResponseKey.Json.CREATED_AT) Instant createdAt,
        @JsonProperty(CatalogResponseKey.Json.UPDATED_AT) Instant updatedAt,
        @JsonProperty(CatalogResponseKey.Json.PARENTS) List<ItemParentResponse> parents,
        @JsonProperty(ResponseKey.Json.CHILDREN) List<ItemParentResponse> children
    ) {
    }

    public record ItemParentResponse(
        @JsonProperty(CatalogResponseKey.Json.EDGE_ID) UUID edgeId,
        @JsonProperty(CatalogResponseKey.Json.ITEM_ID) UUID itemId,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(CatalogResponseKey.Json.RELATION_TYPE) String relationType,
        @JsonProperty(CatalogResponseKey.Json.SORT_ORDER) int sortOrder,
        @JsonProperty(CatalogResponseKey.Json.VALID_FROM) Instant validFrom,
        @JsonProperty(CatalogResponseKey.Json.VALID_TO) Instant validTo,
        @JsonProperty(ResponseKey.Json.IS_SYSTEM) boolean isSystem
    ) {
    }

    public record ItemCreateRequest(
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(CatalogResponseKey.Json.NAME_EN) String nameEn,
        @JsonProperty(ResponseKey.Json.DESCRIPTION) String description,
        @JsonProperty(CatalogResponseKey.Json.ATTRIBUTES) JsonNode attributes,
        @JsonProperty(CatalogResponseKey.Json.SORT_ORDER) Integer sortOrder,
        @JsonProperty(ResponseKey.Json.STATUS) String status
    ) {
    }

    /** Update closes the current version and creates version n+1; {@code code} never changes. */
    public record ItemUpdateRequest(
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(CatalogResponseKey.Json.NAME_EN) String nameEn,
        @JsonProperty(ResponseKey.Json.DESCRIPTION) String description,
        @JsonProperty(CatalogResponseKey.Json.ATTRIBUTES) JsonNode attributes,
        @JsonProperty(CatalogResponseKey.Json.SORT_ORDER) Integer sortOrder,
        @JsonProperty(ResponseKey.Json.STATUS) String status
    ) {
    }

    public record EdgeCreateRequest(
        @JsonProperty(CatalogResponseKey.Json.PARENT_ITEM_ID) String parentItemId,
        @JsonProperty(CatalogResponseKey.Json.CHILD_ITEM_ID) String childItemId,
        @JsonProperty(CatalogResponseKey.Json.RELATION_TYPE) String relationType,
        @JsonProperty(CatalogResponseKey.Json.SORT_ORDER) Integer sortOrder
    ) {
    }

    public record EdgeResponse(
        @JsonProperty(ResponseKey.Json.ID) UUID id,
        @JsonProperty(CatalogResponseKey.Json.PARENT_ITEM_ID) UUID parentItemId,
        @JsonProperty(CatalogResponseKey.Json.CHILD_ITEM_ID) UUID childItemId,
        @JsonProperty(CatalogResponseKey.Json.RELATION_TYPE) String relationType,
        @JsonProperty(CatalogResponseKey.Json.SORT_ORDER) int sortOrder,
        @JsonProperty(ResponseKey.Json.STATUS) String status,
        @JsonProperty(CatalogResponseKey.Json.VALID_FROM) Instant validFrom,
        @JsonProperty(CatalogResponseKey.Json.VALID_TO) Instant validTo,
        @JsonProperty(CatalogResponseKey.Json.CREATED_AT) Instant createdAt
    ) {
    }
}
