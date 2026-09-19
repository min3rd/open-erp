package com.vn9melody.openerp.core.enums;

public enum DataOperation {
    CREATE,
    READ,
    UPDATE,
    DELETE,
    EXPORT,
    SHARE;

    public static DataOperation fromString(String value) {
        if (value == null) {
            return READ;
        }
        for (DataOperation operation : values()) {
            if (operation.name().equalsIgnoreCase(value.trim())) {
                return operation;
            }
        }
        return READ;
    }
}
