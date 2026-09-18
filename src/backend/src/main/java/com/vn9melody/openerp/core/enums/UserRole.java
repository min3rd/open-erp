package com.vn9melody.openerp.core.enums;

public enum UserRole {
    TENANT_ADMIN,
    MEMBER,
    VIEWER,
    OWNER,
    ADMIN;

    public static UserRole fromString(String value) {
        if (value == null) return MEMBER;
        for (UserRole r : values()) {
            if (r.name().equalsIgnoreCase(value)) {
                return r;
            }
        }
        return MEMBER;
    }
}
