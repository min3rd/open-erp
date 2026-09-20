package com.vn9melody.openerp.modules.plugin.model;

import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * In-app notifications for tenant admins (DES-03-DB section 2.7), used by the
 * emergency block/force-uninstall flow (BUG-93, Gate decision Q3).
 */
@Entity
@Table(name = "tenant_notifications")
public class TenantNotification extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "type", nullable = false, length = 40)
    public String type;

    @Column(name = "title_code", nullable = false, length = 120)
    public String titleCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "params", nullable = false, columnDefinition = "jsonb")
    public JsonNode params;

    @Column(name = "severity", nullable = false, length = 16)
    public String severity = "INFO";

    @Column(name = "read_at")
    public Instant readAt;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;
}
