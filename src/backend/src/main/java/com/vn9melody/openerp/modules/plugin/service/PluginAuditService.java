package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.core.audit.AuditTrail;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.modules.platform.service.AuditLogEntry;
import com.vn9melody.openerp.modules.platform.service.AuditLogService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Audit wiring for plugin lifecycle actions (TASK-313).
 *
 * <p>Platform catalog operations are recorded in the immutable platform audit log
 * with the acting Super Admin; tenant-scoped transitions go through {@link AuditTrail}
 * which resolves the acting user from the current token (tenant admin or platform
 * support actor).</p>
 */
@ApplicationScoped
public class PluginAuditService {

    @Inject
    AuditLogService auditLogService;

    @Inject
    AuditTrail auditTrail;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public void platform(UUID actorUserId, PlatformAction action, String pluginKey, UUID targetTenantId,
                         String reason, Map<String, Object> details) {
        if (actorUserId == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("plugin_key", pluginKey);
        if (details != null) {
            payload.putAll(details);
        }
        AuditLogEntry entry = AuditLogEntry
                .of(AuditScope.PLATFORM, null, ActorType.SUPER_ADMIN, actorUserId, action.name(), AuditResult.SUCCESS)
                .resource("PLUGIN", null)
                .details(objectMapper.valueToTree(payload));
        if (targetTenantId != null) {
            entry.targetTenant(targetTenantId);
        }
        if (reason != null && !reason.isBlank()) {
            entry.reason(reason);
        }
        auditLogService.record(entry);
    }

    public void tenant(UUID tenantId, PlatformAction action, String pluginKey, Map<String, Object> details) {
        if (auditTrail.currentActorUserId() == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("plugin_key", pluginKey);
        if (details != null) {
            payload.putAll(details);
        }
        auditTrail.recordSuccess(tenantId, action, "TENANT_PLUGIN", null, payload);
    }
}
