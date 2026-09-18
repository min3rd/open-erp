package com.vn9melody.openerp.core.enums;

public enum TenantType {
    PERSONAL,
    BUSINESS;

    public static TenantType fromString(String value) {
        if (value == null) {
            return PERSONAL;
        }
        String normalized = value.trim();
        if ("ORGANIZATION".equalsIgnoreCase(normalized)) {
            return BUSINESS;
        }
        for (TenantType t : values()) {
            if (t.name().equalsIgnoreCase(normalized)) {
                return t;
            }
        }
        return PERSONAL;
    }
}
