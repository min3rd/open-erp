package com.vn9melody.openerp.modules.platform.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Append-only audit trail (partitioned monthly on created_at). This entity is
 * read-only: writes go through AuditLogService native inserts (hash chain).
 */
@Entity
@Immutable
@Table(name = "platform_audit_logs")
@IdClass(PlatformAuditLogId.class)
@RegisterEntity(
    entityName = "PlatformAuditLog",
    pluginId = "core-platform",
    table = "platform_audit_logs",
    publicFields = {"id", "event_id", "scope", "tenant_id", "actor_user_id", "actor_type", "action", "resource_type", "resource_id", "result", "created_at"},
    relations = {"users", "tenants"}
)
public class PlatformAuditLog extends PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false)
    public UUID id;

    @Id
    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "event_id", nullable = false)
    public UUID eventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 16)
    public AuditScope scope = AuditScope.PLATFORM;

    @Column(name = "tenant_id")
    public UUID tenantId;

    @Column(name = "actor_user_id", nullable = false)
    public UUID actorUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, length = 16)
    public ActorType actorType = ActorType.USER;

    @Column(name = "actor_email_snapshot", nullable = false)
    public String actorEmailSnapshot;

    @Column(name = "action", nullable = false, length = 64)
    public String action;

    @Column(name = "resource_type", length = 64)
    public String resourceType;

    @Column(name = "resource_id")
    public UUID resourceId;

    @Column(name = "target_tenant_id")
    public UUID targetTenantId;

    @Column(name = "target_user_id")
    public UUID targetUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 16)
    public AuditResult result = AuditResult.SUCCESS;

    @Column(name = "correlation_id")
    public UUID correlationId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details", nullable = false, columnDefinition = "jsonb")
    public JsonNode details;

    @Column(name = "ip_address", nullable = false, length = 45)
    public String ipAddress;

    @Column(name = "user_agent", columnDefinition = "text")
    public String userAgent;

    @Column(name = "prev_hash", length = 64)
    public String prevHash;

    @Column(name = "entry_hash", nullable = false, length = 64)
    public String entryHash;
}
