package com.vn9melody.openerp.core.enums;

/**
 * Kind of relation carried by a catalog edge (SOL-S05-001 D3 / DES-DB-S05-001
 * section 2.3). HIERARCHY = parent/child structure, CLASSIFICATION = "belongs
 * to category", ALLOCATION = assignment dimension, CUSTOM = plugin-defined.
 */
public enum CatalogRelationType {
    HIERARCHY,
    CLASSIFICATION,
    ALLOCATION,
    CUSTOM;

    public static CatalogRelationType fromString(String value) {
        return EnumParser.parse(CatalogRelationType.class, value, HIERARCHY);
    }
}
