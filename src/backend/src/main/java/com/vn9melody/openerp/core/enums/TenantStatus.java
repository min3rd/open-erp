package com.vn9melody.openerp.core.enums;

public enum TenantStatus {
    ACTIVE,
    TRIAL,
    SUSPENDED,
    EXPIRED,
    PENDING_DELETION,
    DELETED;

    public static TenantStatus fromString(String value) {
        if (value == null) {
            return ACTIVE;
        }
        for (TenantStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        return ACTIVE;
    }
}
