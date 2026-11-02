package com.vn9melody.openerp.modules.eventhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/** A cross-plugin event published through the Event Hub (ADR-S08-002 §2.1). */
@Entity
@Table(name = "plugin_events")
public class PluginEvent extends PanacheEntityBase {

    @Id
    @Column(name = "id", nullable = false)
    public UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "source_plugin", nullable = false, length = 40)
    public String sourcePlugin;

    @Column(name = "entity", length = 80)
    public String entity;

    @Column(name = "event_type", nullable = false, length = 80)
    public String eventType;

    @Column(name = "aggregate_id", length = 80)
    public String aggregateId;

    @Column(columnDefinition = "jsonb")
    public Object payload;

    @Column(name = "idempotency_key", nullable = false, length = 120)
    public String idempotencyKey;

    @Column(name = "created_at", nullable = false)
    public OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "processed_at")
    public OffsetDateTime processedAt;
}
