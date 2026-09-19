package com.vn9melody.openerp.core.enums;

public enum AuditScope {
    PLATFORM,
    TENANT;

    public static AuditScope fromString(String value) {
        if (value == null) {
            return PLATFORM;
        }
        for (AuditScope scope : values()) {
            if (scope.name().equalsIgnoreCase(value.trim())) {
                return scope;
            }
        }
        return PLATFORM;
    }
}
