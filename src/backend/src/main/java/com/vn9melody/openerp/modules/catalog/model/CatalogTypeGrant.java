package com.vn9melody.openerp.modules.catalog.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
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
@RegisterEntity(
    entityName = "CatalogTypeGrant",
    pluginId = "catalog",
    table = "catalog_type_grants",
    publicFields = {"id", "tenant_id", "type_id", "role_id", "can_read", "can_write", "created_at", "updated_at"},
    relations = {"tenants", "catalog_types", "roles"}
)
public class CatalogTypeGrant extends PanacheEntityBase {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "type_id", nullable = false)
    public UUID typeId;

    @Column(name = "role_id", nullable = false)
    public UUID roleId;

    @Column(name = "can_read", nullable = false)
    public boolean canRead = true;

    @Column(name = "can_write", nullable = false)
    public boolean canWrite = false;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt = Instant.now();
}
