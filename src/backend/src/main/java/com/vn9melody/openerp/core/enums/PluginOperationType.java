package com.vn9melody.openerp.core.enums;

/**
 * Plugin lifecycle operation types recorded in plugin_operation_logs
 * (DES-03-DB section 3 / SOL-01 saga).
 */
public enum PluginOperationType {
    INSTALL,
    UPGRADE,
    UNINSTALL,
    ENABLE,
    DISABLE,
    BLOCK,
    UNBLOCK,
    FORCE_UNINSTALL,
    BULK_APPLY,
    REGISTER_VERSION,
    ROLLBACK;
}
