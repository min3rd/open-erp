package com.vn9melody.openerp.core.enums;

public enum PlatformAdminRole {
    SUPER_ADMIN,
    SUPPORT_ENGINEER;

    public static PlatformAdminRole fromString(String value) {
        if (value == null) {
            return SUPPORT_ENGINEER;
        }
        for (PlatformAdminRole role : values()) {
            if (role.name().equalsIgnoreCase(value.trim())) {
                return role;
            }
        }
        return SUPPORT_ENGINEER;
    }
}
