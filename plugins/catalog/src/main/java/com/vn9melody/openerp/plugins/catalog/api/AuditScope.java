package com.vn9melody.openerp.plugins.catalog.api;


import com.vn9melody.openerp.plugin.sdk.api.EnumParser;
public enum AuditScope {
    PLATFORM,
    TENANT;

    public static AuditScope fromString(String value) {
        return EnumParser.parse(AuditScope.class, value, PLATFORM);
    }
}
