package com.vn9melody.openerp.modules.eventhub.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/** Audit row for an anonymous public fill session (ADR-S08-003). */
@Entity
@Table(name = "plugin_public_sessions")
public class PluginPublicSession extends PanacheEntityBase {

    @Id
    @Column(name = "id", nullable = false)
    public UUID id = UUID.randomUUID();

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "plugin_key", nullable = false, length = 40)
    public String pluginKey;

    @Column(name = "token_hash", nullable = false, length = 128)
    public String tokenHash;

    @Column(name = "expires_at", nullable = false)
    public OffsetDateTime expiresAt;

    @Column(name = "ip_hash", length = 64)
    public String ipHash;

    @Column(name = "created_at", nullable = false)
    public OffsetDateTime createdAt = OffsetDateTime.now();
}
