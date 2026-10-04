package com.vn9melody.openerp.core.enums;

public enum AccountStatus {
    ACTIVE,
    PENDING_VERIFICATION,
    LOCKED,
    SUSPENDED;

    public static AccountStatus fromString(String value) {
        return EnumParser.parse(AccountStatus.class, value, ACTIVE);
    }
}
