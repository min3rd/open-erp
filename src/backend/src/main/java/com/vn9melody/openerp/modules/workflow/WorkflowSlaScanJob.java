package com.vn9melody.openerp.modules.workflow;

import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import com.vn9melody.openerp.modules.plugin.service.PluginRuntimeGatewayService;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.util.Set;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Core-driven SLA scan for the workflow plugin (Sprint 08, ADR-S08-001 §3):
 * the plugin containers receive traffic only through the runtime gateway, so
 * the timer lives here and ticks each ACTIVE (tenant, workflow) pair. The
 * plugin endpoint is idempotent (reminder slots + overdue stamp), so an
 * occasional double tick is harmless.
 */
@ApplicationScoped
public class WorkflowSlaScanJob {

    private static final Logger LOG = Logger.getLogger(WorkflowSlaScanJob.class);
    private static final String WORKFLOW_PLUGIN_KEY = "workflow";

    @Inject
    Vertx vertx;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginRuntimeGatewayService gatewayService;

    @ConfigProperty(name = "openerp.workflow.sla.scan-enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "openerp.workflow.sla.scan-interval-seconds", defaultValue = "60")
    long intervalSeconds;

    void onStart(@Observes StartupEvent event) {
        if (!enabled) {
            return;
        }
        vertx.setPeriodic(intervalSeconds * 1000L, id -> vertx.executeBlocking(() -> {
            scanAll();
            return 0;
        }));
        LOG.info("Workflow SLA scan timer registered");
    }

    public int scanAll() {
        int tenants = 0;
        for (TenantPlugin ledger : tenantPluginRepository.list(
                "pluginKey = ?1 and status = ?2", WORKFLOW_PLUGIN_KEY,
                TenantPluginStatus.ACTIVE)) {
            try {
                gatewayService.forward(ledger.tenantId, null, Set.of(), Set.of(), Set.of(),
                        WORKFLOW_PLUGIN_KEY, null, "POST",
                        "/api/v1/workflow/internal/sla-scan", null,
                        "application/json", new byte[0]);
                tenants++;
            } catch (Exception e) {
                LOG.warnf("Workflow SLA scan failed for tenant %s: %s",
                        ledger.tenantId, e.getMessage());
            }
        }
        return tenants;
    }
}
