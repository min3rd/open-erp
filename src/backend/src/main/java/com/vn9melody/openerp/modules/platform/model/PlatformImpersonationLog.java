package com.vn9melody.openerp.modules.platform.model;

import com.vn9melody.openerp.core.enums.ImpersonationStatus;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_impersonation_logs")
@RegisterEntity(
    entityName = "PlatformImpersonationLog",
    pluginId = "core-platform",
    table = "platform_impersonation_logs",
    publicFields = {"id", "super_admin_user_id", "target_tenant_id", "target_user_id", "support_ticket", "started_at", "ended_at", "status"},
    relations = {"users", "tenants"}
)
public class PlatformImpersonationLog extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "super_admin_user_id", nullable = false)
    public UUID superAdminUserId;

    @Column(name = "target_tenant_id", nullable = false)
    public UUID targetTenantId;

    @Column(name = "target_user_id", nullable = false)
    public UUID targetUserId;

    @Column(name = "reason", nullable = false, columnDefinition = "text")
    public String reason;

    @Column(name = "support_ticket", nullable = false, length = 64)
    public String supportTicket;

    @Column(name = "ip_address", nullable = false, length = 45)
    public String ipAddress;

    @Column(name = "user_agent", columnDefinition = "text")
    public String userAgent;

    @Column(name = "started_at", nullable = false)
    public Instant startedAt = Instant.now();

    @Column(name = "ended_at")
    public Instant endedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    public ImpersonationStatus status = ImpersonationStatus.STARTED;
}
