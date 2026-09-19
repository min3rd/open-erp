package com.vn9melody.openerp.core.enums;

public enum AuditResult {
    SUCCESS,
    DENIED,
    FAILED;

    public static AuditResult fromString(String value) {
        if (value == null) {
            return SUCCESS;
        }
        for (AuditResult result : values()) {
            if (result.name().equalsIgnoreCase(value.trim())) {
                return result;
            }
        }
        return SUCCESS;
    }
}
