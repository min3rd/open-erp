package com.vn9melody.openerp.modules.eventhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/** Delivery attempt of one event to one subscriber plugin. */
@Entity
@Table(name = "plugin_event_deliveries")
public class PluginEventDelivery extends PanacheEntityBase {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_DELIVERED = "DELIVERED";
    public static final String STATUS_FAILED = "FAILED";

    public static final int MAX_ATTEMPTS = 5;
    public static final long BASE_BACKOFF_SECONDS = 60;

    @Id
    @Column(name = "id", nullable = false)
    public UUID id = UUID.randomUUID();

    @Column(name = "event_id", nullable = false)
    public UUID eventId;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "target_plugin", nullable = false, length = 40)
    public String targetPlugin;

    @Column(name = "status", nullable = false, length = 16)
    public String status = STATUS_PENDING;

    @Column(name = "attempts", nullable = false)
    public int attempts = 0;

    @Column(name = "next_retry_at")
    public OffsetDateTime nextRetryAt;

    @Column(name = "last_error", columnDefinition = "text")
    public String lastError;

    @Column(name = "delivered_at")
    public OffsetDateTime deliveredAt;
}
