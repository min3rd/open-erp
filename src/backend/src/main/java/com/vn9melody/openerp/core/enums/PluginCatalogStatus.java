package com.vn9melody.openerp.core.enums;

/**
 * Catalog-level lock status (BUG-93). BLOCKED blocks every publish/install/
 * upgrade path until Super Admin unblocks (P25).
 */
public enum PluginCatalogStatus {
    ACTIVE,
    BLOCKED;

    public static PluginCatalogStatus fromString(String value) {
        return EnumParser.parse(PluginCatalogStatus.class, value, ACTIVE);
    }
}
