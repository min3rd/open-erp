package com.vn9melody.openerp.core.audit;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

/**
 * Default no-op audit recorder. Keeps the engine functional until the platform
 * audit implementation (TASK-291) is registered as an additional CDI bean.
 */
@ApplicationScoped
public class NoOpAuditRecorder implements AuditRecorder {

    private static final Logger LOG = Logger.getLogger(NoOpAuditRecorder.class);

    @Override
    public void record(AuditEvent event) {
        LOG.debugf("Audit (no-op recorder): action=%s, result=%s, resource=%s/%s",
            event.action(), event.result(), event.resourceType(), event.resourceId());
    }
}
