package com.vn9melody.openerp.core.enums;

/**
 * Catalog-level lock status (BUG-93). BLOCKED blocks every publish/install/
 * upgrade path until Super Admin unblocks (P25).
 */
public enum PluginCatalogStatus {
    ACTIVE,
    BLOCKED;

    public static PluginCatalogStatus fromString(String value) {
        if (value == null) {
            return ACTIVE;
        }
        for (PluginCatalogStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        return ACTIVE;
    }
}
