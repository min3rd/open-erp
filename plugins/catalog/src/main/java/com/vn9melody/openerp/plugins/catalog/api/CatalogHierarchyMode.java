package com.vn9melody.openerp.plugins.catalog.api;


import com.vn9melody.openerp.plugin.sdk.api.EnumParser;
/**
 * Hierarchy semantics of a catalog type (DES-DB-S05-001 section 2.1).
 * TREE = single-parent tree, DAG = multi-parent graph, FLAT = no relations.
 */
public enum CatalogHierarchyMode {
    TREE,
    DAG,
    FLAT;

    public static CatalogHierarchyMode fromString(String value) {
        return EnumParser.parse(CatalogHierarchyMode.class, value, TREE);
    }
}
