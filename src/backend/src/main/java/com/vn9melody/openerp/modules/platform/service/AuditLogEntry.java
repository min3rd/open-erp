package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import java.util.UUID;

/**
 * Mutation object for {@link AuditLogService}. Carries every hashed column plus the
 * rich metadata (scope, tenant, actor email snapshot, correlation, reason, client).
 */
public class AuditLogEntry {

    public AuditScope scope = AuditScope.PLATFORM;
    public UUID tenantId;
    public ActorType actorType = ActorType.USER;
    public UUID actorUserId;
    public String actorEmail;
    public String action;
    public String resourceType;
    public UUID resourceId;
    public UUID targetTenantId;
    public UUID targetUserId;
    public AuditResult result = AuditResult.SUCCESS;
    public JsonNode details;
    public String reason;
    public UUID correlationId;
    public String ipAddress = "unknown";
    public String userAgent;

    public static AuditLogEntry of(AuditScope scope, UUID tenantId, ActorType actorType, UUID actorUserId,
                                   String action, AuditResult result) {
        AuditLogEntry entry = new AuditLogEntry();
        entry.scope = scope;
        entry.tenantId = tenantId;
        entry.actorType = actorType;
        entry.actorUserId = actorUserId;
        entry.action = action;
        entry.result = result;
        return entry;
    }

    public AuditLogEntry details(JsonNode value) {
        this.details = value;
        return this;
    }

    public AuditLogEntry reason(String value) {
        this.reason = value;
        return this;
    }

    public AuditLogEntry resource(String type, UUID id) {
        this.resourceType = type;
        this.resourceId = id;
        return this;
    }

    public AuditLogEntry targetTenant(UUID id) {
        this.targetTenantId = id;
        return this;
    }

    public AuditLogEntry targetUser(UUID id) {
        this.targetUserId = id;
        return this;
    }

    public AuditLogEntry actorEmail(String value) {
        this.actorEmail = value;
        return this;
    }

    public AuditLogEntry client(String ip, String userAgent) {
        if (ip != null && !ip.isBlank()) {
            this.ipAddress = ip;
        }
        this.userAgent = userAgent;
        return this;
    }

    public AuditLogEntry correlation(UUID id) {
        this.correlationId = id;
        return this;
    }
}
