package com.vn9melody.openerp.modules.platform.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.audit.AuditTrail;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Enforces plugin availability for a tenant (TASK-270 upgraded by TASK-306).
 *
 * <p>Sprint 03 single source of truth: {@code tenant_plugins} rows with status
 * {@code ACTIVE}. Core modules are always available and never gated here
 * (BR-PLG-01, Gate Q4); optional plugins require an ACTIVE installation.</p>
 */
@ApplicationScoped
public class TenantPluginAllowlistService {

    /** Plugin key of the mandatory core reference entity. */
    public static final String PLUGIN_CORE = "core";

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    EntityManager entityManager;

    @Inject
    AuditTrail auditTrail;

    public boolean isAllowed(UUID tenantId, String pluginKey) {
        if (tenantId == null || pluginKey == null || pluginKey.isBlank()) {
            return false;
        }
        String normalized = pluginKey.trim();
        if (PLUGIN_CORE.equalsIgnoreCase(normalized)) {
            return true;
        }
        Number count = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM tenant_plugins WHERE tenant_id = ?1 AND plugin_key = ?2 AND status = 'ACTIVE'")
                .setParameter(1, tenantId)
                .setParameter(2, normalized)
                .getSingleResult();
        return count != null && count.longValue() > 0;
    }

    /**
     * Fails with {@code 403 PLATFORM_PLUGIN_NOT_ALLOWED} and queues a DENIED
     * audit entry when the plugin is not active for the tenant.
     */
    public void assertAllowed(UUID tenantId, String pluginKey) {
        if (isAllowed(tenantId, pluginKey)) {
            return;
        }
        List<String> allowed = activePluginKeys(tenantId);
        Map<String, Object> params = new HashMap<>();
        params.put(ResponseKey.PLUGIN.getKey(), pluginKey);
        params.put(ResponseKey.ALLOWED_PLUGINS.getKey(), allowed);
        auditTrail.recordDenied(tenantId, PlatformAction.PLUGIN_ACCESS_DENIED, "TENANT_PLUGIN",
            tenantId, params);
        throw new ApiException(403, PlatformErrorCode.PLATFORM_PLUGIN_NOT_ALLOWED,
            "Plugin is not allowed for this tenant", params);
    }

    private List<String> activePluginKeys(UUID tenantId) {
        if (tenantId == null) {
            return List.of();
        }
        return tenantPluginRepository.listActiveByTenant(tenantId).stream()
                .map(plugin -> plugin.pluginKey)
                .toList();
    }

    public List<TenantPlugin> listEntitlements(UUID tenantId) {
        return tenantPluginRepository.listByTenant(tenantId);
    }
}
