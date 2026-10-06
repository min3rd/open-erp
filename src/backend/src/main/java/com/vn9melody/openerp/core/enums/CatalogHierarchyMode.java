package com.vn9melody.openerp.core.enums;

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
