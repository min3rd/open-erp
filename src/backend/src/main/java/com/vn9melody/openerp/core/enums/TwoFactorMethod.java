package com.vn9melody.openerp.core.enums;

public enum TwoFactorMethod {
    TOTP,
    BACKUP_CODE;

    public static TwoFactorMethod fromString(String value) {
        return EnumParser.parse(TwoFactorMethod.class, value, TOTP);
    }
}
