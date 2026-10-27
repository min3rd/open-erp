package com.vn9melody.openerp.core.enums;

public enum TenantType {
    PERSONAL,
    BUSINESS,
    /** Hidden platform-scoped workspace for shared-data plugins (ADR-S05-001 A6.1). */
    SYSTEM;

    public static TenantType fromString(String value) {
        if (value != null && "ORGANIZATION".equalsIgnoreCase(value.trim())) {
            return BUSINESS;
        }
        return EnumParser.parse(TenantType.class, value, PERSONAL);
    }
}
