package com.vn9melody.openerp.core.enums;

public enum TwoFactorMethod {
    TOTP,
    BACKUP_CODE;

    public static TwoFactorMethod fromString(String value) {
        if (value == null) return TOTP;
        for (TwoFactorMethod m : values()) {
            if (m.name().equalsIgnoreCase(value)) {
                return m;
            }
        }
        return TOTP;
    }
}
