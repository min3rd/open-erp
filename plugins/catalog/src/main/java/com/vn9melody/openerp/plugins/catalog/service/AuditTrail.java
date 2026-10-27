package com.vn9melody.openerp.plugins.catalog.service;

import com.vn9melody.openerp.plugins.catalog.api.PlatformAction;
import com.vn9melody.openerp.plugins.catalog.runtime.TenantContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Map;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Local audit trail of the catalog plugin. P1 writes structured log entries;
 * the plugin-owned {@code catalog_audit} table lands with the schema work
 * (ADR-S05-001 A14).
 */
@ApplicationScoped
public class AuditTrail {

    private static final Logger LOG = Logger.getLogger(AuditTrail.class);

    @Inject
    TenantContext tenantContext;

    public void recordSuccess(UUID tenantId, PlatformAction action, String resourceType, UUID resourceId,
                              Map<String, Object> details) {
        record(tenantId, action, resourceType, resourceId, "SUCCESS", details);
    }

    public void recordDenied(UUID tenantId, PlatformAction action, String resourceType, UUID resourceId,
                             Map<String, Object> details) {
        record(tenantId, action, resourceType, resourceId, "DENIED", details);
    }

    private void record(UUID tenantId, PlatformAction action, String resourceType, UUID resourceId,
                        String result, Map<String, Object> details) {
        if (action == null) {
            return;
        }
        LOG.infof("catalog-audit tenant=%s actor=%s action=%s resource=%s/%s result=%s details=%s",
            tenantId, currentActorUserId(), action.name(), resourceType, resourceId, result, details);
    }

    public UUID currentActorUserId() {
        return tenantContext.userId();
    }
}
