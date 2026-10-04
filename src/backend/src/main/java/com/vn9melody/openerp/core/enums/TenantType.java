package com.vn9melody.openerp.core.enums;

public enum TenantType {
    PERSONAL,
    BUSINESS;

    public static TenantType fromString(String value) {
        if (value != null && "ORGANIZATION".equalsIgnoreCase(value.trim())) {
            return BUSINESS;
        }
        return EnumParser.parse(TenantType.class, value, PERSONAL);
    }
}
