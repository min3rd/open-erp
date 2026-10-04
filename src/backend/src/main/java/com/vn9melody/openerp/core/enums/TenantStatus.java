package com.vn9melody.openerp.core.enums;

public enum TenantStatus {
    ACTIVE,
    TRIAL,
    SUSPENDED,
    EXPIRED,
    PENDING_DELETION,
    DELETED;

    public static TenantStatus fromString(String value) {
        return EnumParser.parse(TenantStatus.class, value, ACTIVE);
    }
}
