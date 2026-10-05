package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.deployer.ProcessPluginRuntimeDeployer;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.jboss.logging.Logger;

/**
 * TASK-312/346: idempotent recovery for plugin lifecycle sagas interrupted by a
 * backend crash. A saga writes the ledger to INSTALLING/UPGRADING/UNINSTALLING
 * before touching the runtime; if the process dies in between, the ledger is
 * stuck and the Redis lock only clears via its TTL. The sweeper (see
 * {@link PluginOperationRecoveryJob}) finds ledgers in an intermediate state
 * older than {@code staleMinutes} whose container is gone and closes them as
 * INSTALL_FAILED, releasing the lock, auditing and notifying the tenant.
 */
@ApplicationScoped
public class PluginOperationRecoveryService {

    private static final Logger LOG = Logger.getLogger(PluginOperationRecoveryService.class);

    public static final String TYPE_PLUGIN_OPERATION_ABANDONED = "PLUGIN_OPERATION_ABANDONED";
    public static final String TITLE_PLUGIN_OPERATION_ABANDONED = "NOTIFICATION_PLUGIN_OPERATION_ABANDONED";

    private static final List<TenantPluginStatus> INTERMEDIATE = List.of(
            TenantPluginStatus.INSTALLING, TenantPluginStatus.UPGRADING, TenantPluginStatus.UNINSTALLING);

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    ProcessPluginRuntimeDeployer deployer;

    @Inject
    PluginOperationLockService lockService;

    @Inject
    PluginAuditService auditService;

    @Inject
    PluginNotificationService notificationService;

    /** Closes every abandoned saga older than the cutoff; returns how many were recovered. */
    @Transactional
    public int recoverStale(long staleMinutes, Instant now) {
        Instant cutoff = now.minus(Duration.ofMinutes(staleMinutes));
        List<TenantPlugin> stuck = tenantPluginRepository.list(
                "status in ?1 and updatedAt < ?2", INTERMEDIATE, cutoff);
        int recovered = 0;
        for (TenantPlugin ledger : stuck) {
            ProcessPluginRuntimeDeployer.DeploymentHealth health =
                    deployer.health(fromJson(ledger.deployRef));
            if (health.healthy()) {
                // The container is alive, so the saga may simply still be running
                // (or a long deploy); leave it for the normal path.
                continue;
            }
            java.util.UUID previousOperationId = ledger.operationId;
            ledger.status = TenantPluginStatus.INSTALL_FAILED;
            ledger.lastErrorCode = PluginErrorCode.PLUGIN_OPERATION_RECOVERY_ABANDONED;
            ledger.operationId = null;
            ledger.updatedAt = now;
            lockService.forceRelease(ledger.tenantId, ledger.pluginKey);
            auditService.tenant(ledger.tenantId, PlatformAction.TENANT_PLUGIN_OPERATION_RECOVERED,
                    ledger.pluginKey, Map.of("previous_operation_id",
                            previousOperationId == null ? "" : previousOperationId.toString()));
            notificationService.notifyTenant(ledger.tenantId, TYPE_PLUGIN_OPERATION_ABANDONED,
                    TITLE_PLUGIN_OPERATION_ABANDONED, Map.of("plugin_key", ledger.pluginKey), "WARNING");
            recovered++;
            LOG.infof("Recovered abandoned plugin operation for %s/%s", ledger.tenantId, ledger.pluginKey);
        }
        return recovered;
    }

    private ProcessPluginRuntimeDeployer.DeploymentRef fromJson(JsonNode node) {
        if (node == null || node.isMissingNode() || node.path("deployment").asText("").isBlank()) {
            return null;
        }
        return new ProcessPluginRuntimeDeployer.DeploymentRef(
                node.path("runtime").asText("docker"),
                node.path("deployment").asText(),
                node.path("service").asText(),
                node.path("healthy").asBoolean(false));
    }
}
