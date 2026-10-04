package com.vn9melody.openerp.core.enums;

public enum AuditScope {
    PLATFORM,
    TENANT;

    public static AuditScope fromString(String value) {
        return EnumParser.parse(AuditScope.class, value, PLATFORM);
    }
}
