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
        return EnumParser.parse(PluginMigrationPolicy.class, value, COMPATIBLE);
    }
}
