package com.vn9melody.openerp.core.enums;

public enum TenantType {
    PERSONAL,
    ORGANIZATION;

    public static TenantType fromString(String value) {
        if (value == null) return PERSONAL;
        for (TenantType t : values()) {
            if (t.name().equalsIgnoreCase(value)) {
                return t;
            }
        }
        return PERSONAL;
    }
}
