package com.vn9melody.openerp.modules.platform.service;

/** Audit action names emitted by background/platform jobs. */
public final class PlatformAuditActions {
    public static final String TENANT_AUTO_EXPIRED = "TENANT_AUTO_EXPIRED";
    public static final String TENANT_AUTO_DELETED = "TENANT_AUTO_DELETED";
    public static final String AUDIT_PARTITION_CREATED = "AUDIT_PARTITION_CREATED";
    public static final String AUDIT_PARTITION_DROPPED = "AUDIT_PARTITION_DROPPED";

    private PlatformAuditActions() {}
}
