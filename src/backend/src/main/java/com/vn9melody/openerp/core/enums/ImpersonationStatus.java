package com.vn9melody.openerp.core.enums;

public enum ImpersonationStatus {
    STARTED,
    ENDED,
    TIMEOUT;

    public static ImpersonationStatus fromString(String value) {
        if (value == null) {
            return STARTED;
        }
        for (ImpersonationStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        return STARTED;
    }
}
