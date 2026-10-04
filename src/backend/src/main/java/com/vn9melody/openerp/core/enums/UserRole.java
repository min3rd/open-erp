package com.vn9melody.openerp.core.enums;

public enum UserRole {
    TENANT_ADMIN,
    MEMBER,
    VIEWER,
    OWNER,
    ADMIN;

    public static UserRole fromString(String value) {
        return EnumParser.parse(UserRole.class, value, MEMBER);
    }
}
