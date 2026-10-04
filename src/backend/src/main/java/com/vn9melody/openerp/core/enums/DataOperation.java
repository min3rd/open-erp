package com.vn9melody.openerp.core.enums;

public enum DataOperation {
    CREATE,
    READ,
    UPDATE,
    DELETE,
    EXPORT,
    SHARE;

    public static DataOperation fromString(String value) {
        return EnumParser.parse(DataOperation.class, value, READ);
    }
}
