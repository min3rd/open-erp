package com.vn9melody.openerp.core.enums;

/**
 * Per-tenant plugin installation state machine (DES-03-DB section 3).
 * ROLLBACK_FAILED means schema restore failed: the plugin stays offline until
 * manual intervention, never marked ACTIVE (BUG-86).
 */
public enum TenantPluginStatus {
    NOT_INSTALLED,
    INSTALLING,
    ACTIVE,
    INACTIVE,
    UPGRADING,
    INSTALL_FAILED,
    ROLLBACK_FAILED,
    UNINSTALLING,
    UNINSTALLED;

    public static TenantPluginStatus fromString(String value) {
        if (value == null) {
            return NOT_INSTALLED;
        }
        for (TenantPluginStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        return NOT_INSTALLED;
    }

    public boolean isServing() {
        return this == ACTIVE;
    }
}
