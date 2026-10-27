package com.vn9melody.openerp.plugins.catalog.model;

import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Explicit parent-child edge of a catalog DAG (DES-DB-S05-001 section 2.3).
 * Multi-parent and skip-level relations are single rows; removing a relation
 * closes valid_to instead of deleting the row (D2/D7).
 */
@Entity
@Table(name = "catalog_item_edges")
public class CatalogItemEdge extends PanacheEntityBase {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id")
    public UUID tenantId;

    @Column(name = "parent_item_id", nullable = false)
    public UUID parentItemId;

    @Column(name = "child_item_id", nullable = false)
    public UUID childItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "relation_type", nullable = false, length = 32)
    public CatalogRelationType relationType = CatalogRelationType.HIERARCHY;

    @Column(name = "sort_order", nullable = false)
    public int sortOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    public CatalogStatus status = CatalogStatus.ACTIVE;

    @Column(name = "valid_from", nullable = false)
    public Instant validFrom = Instant.now();

    /** NULL = still effective. */
    @Column(name = "valid_to")
    public Instant validTo;

    @Column(name = "created_by")
    public UUID createdBy;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();
}
