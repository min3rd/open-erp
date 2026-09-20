package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.modules.plugin.deployer.PluginRuntimeDeployer;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Emergency governance (TASK-308 / BUG-93): blocking a plugin forces every
 * affected tenant to be uninstalled (data retained) and notified. Only the
 * platform may trigger it; the catalog block itself is set by PluginAdminService.
 */
@ApplicationScoped
public class PluginGovernanceService {

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginRuntimeDeployer deployer;

    @Inject
    PluginNotificationService notificationService;

    @Inject
    PluginAuditService auditService;

    @Transactional
    public int forceUninstallAll(String pluginKey, String reason) {
        List<TenantPlugin> ledgers = tenantPluginRepository.listByPlugin(pluginKey);
        int affected = 0;
        for (TenantPlugin ledger : ledgers) {
            if (!isRunning(ledger.status)) {
                continue;
            }
            PluginRuntimeDeployer.DeploymentRef ref = deploymentRef(ledger);
            if (ref != null) {
                try {
                    deployer.undeploy(ref);
                } catch (RuntimeException ignored) {
                    // Continue forcing the remaining tenants; ledger must be consistent.
                }
            }
            ledger.status = TenantPluginStatus.UNINSTALLED;
            ledger.installedVersion = null;
            ledger.targetVersion = null;
            ledger.deployRef = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            ledger.uninstalledAt = Instant.now();
            ledger.updatedAt = ledger.uninstalledAt;
            Map<String, Object> params = new HashMap<>();
            params.put("plugin_key", pluginKey);
            params.put("reason", reason);
            notificationService.notifyTenant(ledger.tenantId, PluginNotificationService.TYPE_PLUGIN_FORCE_UNINSTALLED,
                    "PLUGIN_NOTIFICATION_FORCE_UNINSTALLED", params, "CRITICAL");
            auditService.tenant(ledger.tenantId, PlatformAction.TENANT_PLUGIN_FORCE_UNINSTALLED, pluginKey, params);
            affected++;
        }
        return affected;
    }

    private boolean isRunning(TenantPluginStatus status) {
        return status == TenantPluginStatus.ACTIVE || status == TenantPluginStatus.INACTIVE
                || status == TenantPluginStatus.INSTALLING || status == TenantPluginStatus.UPGRADING;
    }

    private PluginRuntimeDeployer.DeploymentRef deploymentRef(TenantPlugin ledger) {
        JsonNode node = ledger.deployRef;
        if (node == null || node.isMissingNode() || node.path("deployment").asText("").isBlank()) {
            return null;
        }
        return new PluginRuntimeDeployer.DeploymentRef(
                node.path("runtime").asText("docker"),
                node.path("deployment").asText(),
                node.path("service").asText(),
                node.path("healthy").asBoolean(false));
    }
}
