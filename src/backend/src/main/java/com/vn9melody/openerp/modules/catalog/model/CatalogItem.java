package com.vn9melody.openerp.modules.catalog.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.CatalogStatus;
import com.vn9melody.openerp.core.registry.RegisterEntity;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Versioned, effective-dated catalog record (DES-DB-S05-001 section 2.2).
 * Editing creates a new row with the same version_group_id and version + 1,
 * closing the previous row with valid_to; deletion only closes valid_to (D5/D7).
 */
@Entity
@Table(name = "catalog_items")
@RegisterEntity(
    entityName = "CatalogItem",
    pluginId = "catalog",
    table = "catalog_items",
    publicFields = {"id", "tenant_id", "type_id", "version_group_id", "version", "code", "name",
        "name_en", "description", "sort_order", "status", "valid_from", "valid_to",
        "supersedes_item_id", "created_at", "updated_at"},
    relations = {"tenants", "catalog_types", "catalog_items"}
)
public class CatalogItem extends PanacheEntityBase {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id")
    public UUID tenantId;

    @Column(name = "type_id", nullable = false)
    public UUID typeId;

    @Column(name = "version_group_id", nullable = false)
    public UUID versionGroupId;

    @Column(name = "version", nullable = false)
    public int version = 1;

    @Column(name = "code", nullable = false, length = 64)
    public String code;

    @Column(name = "name", nullable = false, length = 255)
    public String name;

    @Column(name = "name_en", length = 255)
    public String nameEn;

    @Column(name = "description", columnDefinition = "text")
    public String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes", columnDefinition = "jsonb")
    public JsonNode attributes;

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

    @Column(name = "supersedes_item_id")
    public UUID supersedesItemId;

    @Column(name = "created_by")
    public UUID createdBy;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    @Column(name = "updated_by")
    public UUID updatedBy;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt = Instant.now();
}
