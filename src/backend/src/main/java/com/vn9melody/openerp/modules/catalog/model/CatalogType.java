package com.vn9melody.openerp.modules.catalog.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
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
 * Catalog type definition (DES-DB-S05-001 section 2.1). tenant_id NULL means a
 * system type owned by the platform; tenant rows may override a system code
 * (D10/D18: tenant wins when options are merged).
 */
@Entity
@Table(name = "catalog_types")
@RegisterEntity(
    entityName = "CatalogType",
    pluginId = "catalog",
    table = "catalog_types",
    publicFields = {"id", "tenant_id", "code", "name_key", "description_key", "hierarchy_mode",
        "allowed_relations", "allowed_parent_types", "max_depth", "min_parents", "allow_free_text",
        "versioned", "effective_dated", "status", "created_at", "updated_at"},
    relations = {"tenants", "catalog_types"}
)
public class CatalogType extends PanacheEntityBase {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id")
    public UUID tenantId;

    @Column(name = "code", nullable = false, length = 64)
    public String code;

    @Column(name = "name_key", nullable = false, length = 128)
    public String nameKey;

    @Column(name = "description_key", length = 128)
    public String descriptionKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "hierarchy_mode", nullable = false, length = 16)
    public CatalogHierarchyMode hierarchyMode = CatalogHierarchyMode.TREE;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "allowed_relations", nullable = false, columnDefinition = "varchar(32)[]")
    public String[] allowedRelations = {"HIERARCHY"};

    /** NULL = same-type parents only (safe default). */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "allowed_parent_types", columnDefinition = "varchar(64)[]")
    public String[] allowedParentTypes;

    @Column(name = "max_depth")
    public Short maxDepth;

    @Column(name = "min_parents", nullable = false)
    public short minParents = 0;

    @Column(name = "allow_free_text", nullable = false)
    public boolean allowFreeText = false;

    @Column(name = "versioned", nullable = false)
    public boolean versioned = true;

    @Column(name = "effective_dated", nullable = false)
    public boolean effectiveDated = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes_schema", columnDefinition = "jsonb")
    public JsonNode attributesSchema;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    public CatalogStatus status = CatalogStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt = Instant.now();
}
