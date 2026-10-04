package com.vn9melody.openerp.core.enums;

/**
 * Release lifecycle of a plugin version (DES-03-DB section 3).
 * BLOCKED can only be set and cleared by the platform (P7/P26).
 */
public enum PluginReleaseStatus {
    DRAFT,
    PUBLISHED,
    DEPRECATED,
    BLOCKED;

    public static PluginReleaseStatus fromString(String value) {
        return EnumParser.parse(PluginReleaseStatus.class, value, DRAFT);
    }
}
