package com.vn9melody.openerp.core.enums;

/**
 * Migration compatibility policy declared per plugin version (BUG-86).
 * BREAKING requires a mandatory pre-upgrade schema snapshot
 * (PLUGIN_SNAPSHOT_REQUIRED; snapshot=false is rejected).
 */
public enum PluginMigrationPolicy {
    COMPATIBLE,
    BREAKING;

    public static PluginMigrationPolicy fromString(String value) {
        if (value == null) {
            return COMPATIBLE;
        }
        for (PluginMigrationPolicy policy : values()) {
            if (policy.name().equalsIgnoreCase(value.trim())) {
                return policy;
            }
        }
        return COMPATIBLE;
    }
}
