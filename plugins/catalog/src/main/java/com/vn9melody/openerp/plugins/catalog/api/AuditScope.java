package com.vn9melody.openerp.plugins.catalog.api;

public enum AuditScope {
    PLATFORM,
    TENANT;

    public static AuditScope fromString(String value) {
        return EnumParser.parse(AuditScope.class, value, PLATFORM);
    }
}
