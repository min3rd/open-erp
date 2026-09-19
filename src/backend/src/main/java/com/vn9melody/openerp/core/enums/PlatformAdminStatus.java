package com.vn9melody.openerp.core.enums;

public enum PlatformAdminStatus {
    INVITED,
    ACTIVE,
    DISABLED,
    REVOKED;

    public static PlatformAdminStatus fromString(String value) {
        if (value == null) {
            return INVITED;
        }
        for (PlatformAdminStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        return INVITED;
    }
}
