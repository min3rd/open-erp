package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Bulk apply for platform defaults / rollouts (TASK-307 / P10-P11): preview the
 * affected tenants, then grant entitlements and install/upgrade with a per-tenant
 * report. Synchronous and bounded; the async job variant lands with TASK-312.
 */
@ApplicationScoped
public class PluginBulkApplyService {

    private static final int PREVIEW_LIMIT = 500;

    @Inject
    EntityManager entityManager;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginEntitlementService entitlementService;

    @Inject
    PluginLifecycleService lifecycleService;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginAuditService auditService;

    @Transactional
    public PluginResponses.BulkPreview preview(String pluginKey) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        List<String> pending = new ArrayList<>();
        for (UUID tenantId : allTenantIds()) {
            TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, catalog.pluginKey).orElse(null);
            if (ledger == null || ledger.status != TenantPluginStatus.ACTIVE) {
                pending.add(tenantId.toString());
            }
            if (pending.size() >= PREVIEW_LIMIT) {
                break;
            }
        }
        PluginResponses.BulkPreview preview = new PluginResponses.BulkPreview();
        preview.total = pending.size();
        preview.tenantIds = pending;
        return preview;
    }

    @Transactional
    public PluginResponses.BulkReport apply(String pluginKey, String targetVersion, List<UUID> tenantIds,
                                            UUID actorId, String reason) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        if (catalog.catalogStatus == PluginCatalogStatus.BLOCKED) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_BLOCKED_BY_PLATFORM, "Catalog is blocked");
        }
        List<UUID> targets = tenantIds != null && !tenantIds.isEmpty() ? tenantIds : allTenantIds();
        int succeeded = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();
        for (UUID tenantId : targets) {
            try {
                if (!entitlementService.grantIfExists(tenantId, catalog.pluginKey)) {
                    failed++;
                    errors.add(tenantId + ":PLUGIN_NOT_FOUND");
                    continue;
                }
                TenantPlugin ledger = tenantPluginRepository
                        .findByTenantAndKey(tenantId, catalog.pluginKey)
                        .orElseThrow(() -> new ApiException(500, PluginErrorCode.PLUGIN_NOT_FOUND,
                                "Entitlement row missing after grant"));
                if (ledger.status == TenantPluginStatus.ACTIVE) {
                    if (targetVersion != null && !targetVersion.isBlank()
                            && !targetVersion.equals(ledger.installedVersion)) {
                        lifecycleService.upgrade(tenantId, catalog.pluginKey, targetVersion, null, actorId);
                    }
                } else {
                    lifecycleService.install(tenantId, catalog.pluginKey, targetVersion, actorId);
                }
                succeeded++;
            } catch (ApiException e) {
                failed++;
                errors.add(tenantId + ":" + e.getCode());
            }
        }
        Map<String, Object> details = new HashMap<>();
        details.put("succeeded", succeeded);
        details.put("failed", failed);
        auditService.platform(actorId, PlatformAction.TENANT_PLUGIN_BULK_APPLIED, catalog.pluginKey, null,
                reason, details);
        PluginResponses.BulkReport report = new PluginResponses.BulkReport();
        report.requested = targets.size();
        report.succeeded = succeeded;
        report.failed = failed;
        report.errors = errors;
        return report;
    }

    private PluginCatalog requireCatalog(String pluginKey) {
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Plugin not found");
        }
        return catalog;
    }

    @SuppressWarnings("unchecked")
    private List<UUID> allTenantIds() {
        return entityManager
                .createNativeQuery("SELECT id FROM tenants WHERE status IN ('ACTIVE','TRIAL') ORDER BY created_at")
                .getResultList();
    }
}
