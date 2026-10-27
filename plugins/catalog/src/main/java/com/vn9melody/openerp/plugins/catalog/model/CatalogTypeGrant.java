package com.vn9melody.openerp.plugins.catalog.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Per-role read/write grant on one catalog type (DES-DB-S05-001 section 2.4,
 * SOL-S05-001 D9). Both the module permission and a grant on the type are
 * required, except for the platform admin on system types.
 */
@Entity
@Table(name = "catalog_type_grants")
public class CatalogTypeGrant extends PanacheEntityBase {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "type_id", nullable = false)
    public UUID typeId;

    @Column(name = "role_code", nullable = false, length = 80)
    public String roleCode;

    @Column(name = "can_read", nullable = false)
    public boolean canRead = true;

    @Column(name = "can_write", nullable = false)
    public boolean canWrite = false;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt = Instant.now();
}
