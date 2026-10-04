package com.vn9melody.openerp.core.enums;

public enum AuditResult {
    SUCCESS,
    DENIED,
    FAILED;

    public static AuditResult fromString(String value) {
        return EnumParser.parse(AuditResult.class, value, SUCCESS);
    }
}
