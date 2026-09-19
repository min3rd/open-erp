package com.vn9melody.openerp.modules.platform.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.audit.AuditTrail;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Enforces the tenant plugin allowlist {@code tenants.allowed_plugins} (TASK-270 / BUG-53).
 *
 * <p>Plugin Manager does not exist yet in Sprint 02 (no install/enable API to guard), so
 * this service is the prepared enforcement point: every future plugin entry point calls
 * {@link #assertAllowed(UUID, String)} before touching tenant data. The reference entity
 * service ({@code SampleRecordService}, plugin {@code core}) demonstrates the hook.</p>
 *
 * <p>Decision note: the canonical response code is {@code PLATFORM_PLUGIN_NOT_ALLOWED}
 * from DES-02-API section 6.1 (also required by BUG-53/TASK-270), not the provisional
 * {@code TENANT_PLUGIN_NOT_ALLOWED} name mentioned in the wave brief.</p>
 */
@ApplicationScoped
public class TenantPluginAllowlistService {

    /** Plugin key of the mandatory core plugin (reference entity lives here). */
    public static final String PLUGIN_CORE = "core";

    @Inject
    EntityManager entityManager;

    @Inject
    AuditTrail auditTrail;

    /** True when {@code pluginKey} is part of the tenant allowlist (case-insensitive). */
    public boolean isAllowed(UUID tenantId, String pluginKey) {
        if (tenantId == null || pluginKey == null || pluginKey.isBlank()) {
            return false;
        }
        Tenant tenant = entityManager.find(Tenant.class, tenantId);
        if (tenant == null || tenant.allowedPlugins == null) {
            return false;
        }
        String normalized = pluginKey.trim();
        for (String allowed : tenant.allowedPlugins) {
            if (allowed != null && allowed.trim().equalsIgnoreCase(normalized)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Fails with {@code 403 PLATFORM_PLUGIN_NOT_ALLOWED} and queues a DENIED audit entry
     * when the plugin is not in the tenant allowlist (khuôn mẫu 4 error).
     */
    public void assertAllowed(UUID tenantId, String pluginKey) {
        if (isAllowed(tenantId, pluginKey)) {
            return;
        }
        List<String> allowed = allowedPlugins(tenantId);
        Map<String, Object> params = new HashMap<>();
        params.put(ResponseKey.PLUGIN.getKey(), pluginKey);
        params.put(ResponseKey.ALLOWED_PLUGINS.getKey(), allowed);
        auditTrail.recordDenied(tenantId, PlatformAction.PLUGIN_ACCESS_DENIED, "TENANT_PLUGIN",
            tenantId, params);
        throw new ApiException(403, PlatformErrorCode.PLATFORM_PLUGIN_NOT_ALLOWED,
            "Plugin is not allowed for this tenant", params);
    }

    private List<String> allowedPlugins(UUID tenantId) {
        if (tenantId == null) {
            return List.of();
        }
        Tenant tenant = entityManager.find(Tenant.class, tenantId);
        if (tenant == null || tenant.allowedPlugins == null) {
            return List.of();
        }
        return new ArrayList<>(tenant.allowedPlugins);
    }
}
