package com.vn9melody.openerp.core.enums;

public enum PlatformAdminRole {
    SUPER_ADMIN,
    SUPPORT_ENGINEER;

    public static PlatformAdminRole fromString(String value) {
        return EnumParser.parse(PlatformAdminRole.class, value, SUPPORT_ENGINEER);
    }
}
