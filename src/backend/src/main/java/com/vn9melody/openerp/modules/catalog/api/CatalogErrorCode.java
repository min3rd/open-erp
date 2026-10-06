package com.vn9melody.openerp.modules.catalog.api;

/**
 * Canonical response codes of the Catalog plugin APIs (DES-API-S05-001 section 6).
 * The frontend resolves every code through its own i18n dictionaries; the backend
 * never embeds localised user-facing text in payloads.
 */
public final class CatalogErrorCode {

    private CatalogErrorCode() {
    }

    // Success - plugin descriptor
    public static final String CATALOG_PLUGIN_MANIFEST_SUCCESS = "CATALOG_PLUGIN_MANIFEST_SUCCESS";

    // Success - types
    public static final String CATALOG_TYPE_FETCH_SUCCESS = "CATALOG_TYPE_FETCH_SUCCESS";    public static final String CATALOG_TYPE_CREATED_SUCCESS = "CATALOG_TYPE_CREATED_SUCCESS";
    public static final String CATALOG_TYPE_UPDATED_SUCCESS = "CATALOG_TYPE_UPDATED_SUCCESS";

    // Errors - types
    public static final String CATALOG_TYPE_NOT_FOUND = "CATALOG_TYPE_NOT_FOUND";
    public static final String CATALOG_TYPE_CODE_EXISTS = "CATALOG_TYPE_CODE_EXISTS";
    public static final String CATALOG_TYPE_FORBIDDEN = "CATALOG_TYPE_FORBIDDEN";

    // Success - items
    public static final String CATALOG_ITEM_FETCH_SUCCESS = "CATALOG_ITEM_FETCH_SUCCESS";
    public static final String CATALOG_ITEM_CREATED_SUCCESS = "CATALOG_ITEM_CREATED_SUCCESS";
    public static final String CATALOG_ITEM_UPDATED_SUCCESS = "CATALOG_ITEM_UPDATED_SUCCESS";
    public static final String CATALOG_ITEM_CLOSED_SUCCESS = "CATALOG_ITEM_CLOSED_SUCCESS";

    // Errors - items
    public static final String CATALOG_ITEM_NOT_FOUND = "CATALOG_ITEM_NOT_FOUND";
    public static final String CATALOG_ITEM_CODE_EXISTS = "CATALOG_ITEM_CODE_EXISTS";
    public static final String CATALOG_ITEM_WINDOW_OVERLAP = "CATALOG_ITEM_WINDOW_OVERLAP";
    public static final String CATALOG_SYSTEM_ITEM_READONLY = "CATALOG_SYSTEM_ITEM_READONLY";

    // Success - edges
    public static final String CATALOG_EDGE_CREATED_SUCCESS = "CATALOG_EDGE_CREATED_SUCCESS";
    public static final String CATALOG_EDGE_CLOSED_SUCCESS = "CATALOG_EDGE_CLOSED_SUCCESS";

    // Errors - edges
    public static final String CATALOG_EDGE_CYCLE = "CATALOG_EDGE_CYCLE";
    public static final String CATALOG_EDGE_DUPLICATE = "CATALOG_EDGE_DUPLICATE";
    public static final String CATALOG_EDGE_NOT_FOUND = "CATALOG_EDGE_NOT_FOUND";
    public static final String CATALOG_EDGE_SELF_REFERENCE = "CATALOG_EDGE_SELF_REFERENCE";
    /** Relation not declared in the child type's {@code allowed_relations}. */
    public static final String CATALOG_EDGE_RELATION_NOT_ALLOWED = "CATALOG_EDGE_RELATION_NOT_ALLOWED";
    /** Cross-type parent not declared in the child type's {@code allowed_parent_types}. */
    public static final String CATALOG_EDGE_PARENT_TYPE_NOT_ALLOWED = "CATALOG_EDGE_PARENT_TYPE_NOT_ALLOWED";
    /** Closing the edge would drop the child below the type's {@code min_parents}. */
    public static final String CATALOG_EDGE_MIN_PARENTS = "CATALOG_EDGE_MIN_PARENTS";

    // Success - grants
    public static final String CATALOG_GRANT_FETCH_SUCCESS = "CATALOG_GRANT_FETCH_SUCCESS";
    public static final String CATALOG_GRANT_UPDATED_SUCCESS = "CATALOG_GRANT_UPDATED_SUCCESS";

    // Success - lookup
    public static final String CATALOG_LOOKUP_TYPES_SUCCESS = "CATALOG_LOOKUP_TYPES_SUCCESS";
    public static final String CATALOG_LOOKUP_OPTIONS_SUCCESS = "CATALOG_LOOKUP_OPTIONS_SUCCESS";
    public static final String CATALOG_LOOKUP_RESOLVE_SUCCESS = "CATALOG_LOOKUP_RESOLVE_SUCCESS";
    public static final String CATALOG_LOOKUP_INLINE_SUCCESS = "CATALOG_LOOKUP_INLINE_SUCCESS";

    // Errors - lookup
    public static final String CATALOG_LOOKUP_INLINE_DUPLICATE = "CATALOG_LOOKUP_INLINE_DUPLICATE";
    /** Inline quick-create is only offered by types with {@code allow_free_text}. */
    public static final String CATALOG_LOOKUP_INLINE_NOT_ALLOWED = "CATALOG_LOOKUP_INLINE_NOT_ALLOWED";

    // Import / Export (TASK-390; declared here as the canonical catalog code set)
    public static final String CATALOG_IMPORT_SUCCESS = "CATALOG_IMPORT_SUCCESS";
    public static final String CATALOG_IMPORT_VALIDATION_FAILED = "CATALOG_IMPORT_VALIDATION_FAILED";
    public static final String CATALOG_IMPORT_TOO_LARGE = "CATALOG_IMPORT_TOO_LARGE";
    public static final String CATALOG_IMPORT_TEMPLATE_SUCCESS = "CATALOG_IMPORT_TEMPLATE_SUCCESS";
    public static final String CATALOG_EXPORT_SUCCESS = "CATALOG_EXPORT_SUCCESS";
    /** One import row is malformed; {@code params.field} carries the offending column. */
    public static final String CATALOG_IMPORT_ROW_INVALID = "CATALOG_IMPORT_ROW_INVALID";
}
