package com.vn9melody.openerp.modules.plugin.model;

import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Append-only saga trail for plugin lifecycle operations (DES-03-DB section 2.6).
 * Supports diagnostics and idempotent job recovery.
 */
@Entity
@Table(name = "plugin_operation_logs")
public class PluginOperationLog extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    public Long id;

    @Column(name = "operation_id", nullable = false)
    public UUID operationId;

    @Column(name = "tenant_id")
    public UUID tenantId;

    @Column(name = "plugin_key", nullable = false, length = 100)
    public String pluginKey;

    @Column(name = "operation", nullable = false, length = 40)
    public String operation;

    @Column(name = "step", nullable = false, length = 60)
    public String step;

    @Column(name = "result", nullable = false, length = 16)
    public String result;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detail", nullable = false, columnDefinition = "jsonb")
    public JsonNode detail;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;
}
