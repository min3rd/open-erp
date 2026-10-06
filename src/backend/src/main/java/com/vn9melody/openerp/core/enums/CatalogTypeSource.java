package com.vn9melody.openerp.core.enums;

/**
 * Data source of a catalog type (DES-DB-S05-001 section 2.1). PLUGIN = owned by
 * the catalog plugin, SYSTEM_BACKED = projected from a core table (e.g.
 * departments) and refreshed one-way.
 */
public enum CatalogTypeSource {
    PLUGIN,
    SYSTEM_BACKED;

    public static CatalogTypeSource fromString(String value) {
        return EnumParser.parse(CatalogTypeSource.class, value, PLUGIN);
    }
}
