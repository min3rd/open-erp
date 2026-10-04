package com.vn9melody.openerp.core.enums;

/**
 * Registry credential scope (Gate 2026-09-19). PLATFORM credentials are
 * managed by Super Admin; TENANT credentials belong to one tenant.
 */
public enum PluginCredentialScope {
    PLATFORM,
    TENANT;

    public static PluginCredentialScope fromString(String value) {
        return EnumParser.parse(PluginCredentialScope.class, value, PLATFORM);
    }
}
