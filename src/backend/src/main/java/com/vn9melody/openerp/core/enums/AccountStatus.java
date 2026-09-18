package com.vn9melody.openerp.core.enums;

public enum AccountStatus {
    ACTIVE,
    PENDING_VERIFICATION,
    LOCKED,
    SUSPENDED;

    public static AccountStatus fromString(String value) {
        if (value == null) return ACTIVE;
        for (AccountStatus s : values()) {
            if (s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        return ACTIVE;
    }
}
