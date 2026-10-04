package com.vn9melody.openerp.core.enums;

public enum PlatformAdminStatus {
    INVITED,
    ACTIVE,
    DISABLED,
    REVOKED;

    public static PlatformAdminStatus fromString(String value) {
        return EnumParser.parse(PlatformAdminStatus.class, value, INVITED);
    }
}
