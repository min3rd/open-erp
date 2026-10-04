package com.vn9melody.openerp.core.enums;

public enum ImpersonationStatus {
    STARTED,
    ENDED,
    TIMEOUT;

    public static ImpersonationStatus fromString(String value) {
        return EnumParser.parse(ImpersonationStatus.class, value, STARTED);
    }
}
