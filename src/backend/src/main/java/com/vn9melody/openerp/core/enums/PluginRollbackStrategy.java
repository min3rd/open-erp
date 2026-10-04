package com.vn9melody.openerp.core.enums;

/**
 * Rollback technique declared per plugin version (BUG-86).
 * SNAPSHOT_RESTORE restores the pre-upgrade snapshot after a preservation
 * snapshot; DOWN_MIGRATION requires the plugin to run verified down migrations.
 */
public enum PluginRollbackStrategy {
    SNAPSHOT_RESTORE,
    DOWN_MIGRATION;

    public static PluginRollbackStrategy fromString(String value) {
        return EnumParser.parse(PluginRollbackStrategy.class, value, SNAPSHOT_RESTORE);
    }
}
