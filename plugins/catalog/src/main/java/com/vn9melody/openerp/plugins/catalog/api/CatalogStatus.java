package com.vn9melody.openerp.plugins.catalog.api;


import com.vn9melody.openerp.plugin.sdk.api.EnumParser;
/**
 * Lifecycle status shared by catalog types, items and edges
 * (DES-DB-S05-001 sections 2.1-2.3). Deletion closes the validity window;
 * INACTIVE marks a tenant override that hides a system record (D18).
 */
public enum CatalogStatus {
    ACTIVE,
    INACTIVE;

    public static CatalogStatus fromString(String value) {
        return EnumParser.parse(CatalogStatus.class, value, ACTIVE);
    }
}
