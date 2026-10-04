package com.vn9melody.openerp.core.enums;

/**
 * Plugin visibility scope (DES-03-DB section 3). PLATFORM plugins are
 * registered by Super Admin; TENANT_PRIVATE plugins belong to one tenant.
 */
public enum PluginVisibility {
    PLATFORM,
    TENANT_PRIVATE;

    public static PluginVisibility fromString(String value) {
        return EnumParser.parse(PluginVisibility.class, value, PLATFORM);
    }
}
