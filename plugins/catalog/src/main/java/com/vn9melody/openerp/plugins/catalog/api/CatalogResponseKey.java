package com.vn9melody.openerp.plugins.catalog.api;


import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Type-safe payload keys of the Catalog plugin APIs (AGENTS.md: zero hardcoded
 * payload keys). Keys that already exist on the shared
 * {@link com.vn9melody.openerp.core.enums.ResponseKey} are referenced from there;
 * this enum carries the catalog-specific keys, mirroring the PluginResponseKey
 * pattern. The {@code Json} constants exist so DTO {@code @JsonProperty}
 * annotations stay compile-time constants.
 */
public enum CatalogResponseKey {

    // Types
    TYPE_ID("type_id"),
    TYPE_CODE("type_code"),
    IS_CLONE("is_clone"),
    NAME_KEY("name_key"),
    HIERARCHY_MODE("hierarchy_mode"),
    ALLOWED_RELATIONS("allowed_relations"),
    ALLOWED_PARENT_TYPES("allowed_parent_types"),
    MAX_DEPTH("max_depth"),
    MIN_PARENTS("min_parents"),
    ALLOW_FREE_TEXT("allow_free_text"),
    VERSIONED("versioned"),
    EFFECTIVE_DATED("effective_dated"),
    ATTRIBUTES_SCHEMA("attributes_schema"),

    // Items
    VERSION_GROUP_ID("version_group_id"),
    VERSION("version"),
    NAME_EN("name_en"),
    ATTRIBUTES("attributes"),
    SORT_ORDER("sort_order"),
    VALID_FROM("valid_from"),
    VALID_TO("valid_to"),
    SUPERSEDES_ITEM_ID("supersedes_item_id"),
    CREATED_AT("created_at"),
    UPDATED_AT("updated_at"),

    // Lookup
    OVERRIDDEN("overridden"),
    PATH("path"),
    HAS_CHILDREN("has_children"),
    MULTIPLE("multiple"),
    PARENT_TYPE_CODE("parent_type_code"),
    IDS("ids"),

    // Edges
    EDGE_ID("edge_id"),
    ITEM_ID("item_id"),
    PARENT_ITEM_ID("parent_item_id"),
    CHILD_ITEM_ID("child_item_id"),
    RELATION_TYPE("relation_type"),
    PARENTS("parents"),
    CHILDREN("children"),
    PARENT_CODES("parent_codes"),
    CHILD_CODES("child_codes"),
    RELATIONS("relations"),
    TYPES("types"),
    ITEMS("items"),
    EDGES("edges"),
    TENANT_TYPE_ID("tenant_type_id"),

    // Grants
    CAN_READ("can_read"),
    CAN_WRITE("can_write"),
    GRANTS("grants"),

    // Import / export (TASK-390)
    DRY_RUN("dry_run"),
    TOTAL_ROWS("total_rows"),
    CREATED("created"),
    UPDATED("updated"),
    SKIPPED("skipped"),
    EDGES_CREATED("edges_created"),
    ERRORS("errors"),
    ROWS("rows"),
    ROW("row"),
    PARAMS("params");

    public interface Json {
        String TYPE_ID = "type_id";
        String TYPE_CODE = "type_code";
        String IS_CLONE = "is_clone";
        String NAME_KEY = "name_key";
        String HIERARCHY_MODE = "hierarchy_mode";
        String ALLOWED_RELATIONS = "allowed_relations";
        String ALLOWED_PARENT_TYPES = "allowed_parent_types";
        String MAX_DEPTH = "max_depth";
        String MIN_PARENTS = "min_parents";
        String ALLOW_FREE_TEXT = "allow_free_text";
        String VERSIONED = "versioned";
        String EFFECTIVE_DATED = "effective_dated";
        String ATTRIBUTES_SCHEMA = "attributes_schema";
        String VERSION_GROUP_ID = "version_group_id";
        String VERSION = "version";
        String NAME_EN = "name_en";
        String ATTRIBUTES = "attributes";
        String SORT_ORDER = "sort_order";
        String VALID_FROM = "valid_from";
        String VALID_TO = "valid_to";
        String SUPERSEDES_ITEM_ID = "supersedes_item_id";
        String CREATED_AT = "created_at";
        String UPDATED_AT = "updated_at";
        String OVERRIDDEN = "overridden";
        String PATH = "path";
        String HAS_CHILDREN = "has_children";
        String MULTIPLE = "multiple";
        String PARENT_TYPE_CODE = "parent_type_code";
        String IDS = "ids";
        String EDGE_ID = "edge_id";
        String ITEM_ID = "item_id";
        String PARENT_ITEM_ID = "parent_item_id";
        String CHILD_ITEM_ID = "child_item_id";
        String RELATION_TYPE = "relation_type";
        String PARENTS = "parents";
        String CHILDREN = "children";
        String PARENT_CODES = "parent_codes";
        String CHILD_CODES = "child_codes";
        String RELATIONS = "relations";
        String TYPES = "types";
        String ITEMS = "items";
        String EDGES = "edges";
        String TENANT_TYPE_ID = "tenant_type_id";
        String CAN_READ = "can_read";
        String CAN_WRITE = "can_write";
        String GRANTS = "grants";
        String DRY_RUN = "dry_run";
        String TOTAL_ROWS = "total_rows";
        String CREATED = "created";
        String UPDATED = "updated";
        String SKIPPED = "skipped";
        String EDGES_CREATED = "edges_created";
        String ERRORS = "errors";
        String ROWS = "rows";
        String ROW = "row";
        String PARAMS = "params";
    }

    private final String key;

    CatalogResponseKey(String key) {
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
