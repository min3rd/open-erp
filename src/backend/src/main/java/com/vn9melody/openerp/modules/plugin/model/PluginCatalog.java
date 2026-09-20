package com.vn9melody.openerp.modules.plugin.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Optional plugin catalog entry (DES-03-DB section 2.1). Core modules are NOT
 * part of this table. plugin_key is globally unique for every visibility (BUG-85).
 */
@Entity
@Table(name = "plugin_catalog")
@RegisterEntity(
    entityName = "PluginCatalog",
    pluginId = "core-plugin",
    table = "plugin_catalog",
    publicFields = {"id", "plugin_key", "name_key", "description_key", "visibility", "default_install", "locked", "catalog_status"}
)
public class PluginCatalog extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "plugin_key", nullable = false, unique = true, length = 100)
    public String pluginKey;

    @Column(name = "name_key", nullable = false, length = 120)
    public String nameKey;

    @Column(name = "description_key", nullable = false, length = 120)
    public String descriptionKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 20)
    public PluginVisibility visibility = PluginVisibility.PLATFORM;

    @Column(name = "owner_tenant_id")
    public UUID ownerTenantId;

    @Column(name = "default_install", nullable = false)
    public boolean defaultInstall = false;

    @Column(name = "locked", nullable = false)
    public boolean locked = false;

    @Column(name = "is_core", nullable = false)
    public boolean core = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "catalog_status", nullable = false, length = 16)
    public PluginCatalogStatus catalogStatus = PluginCatalogStatus.ACTIVE;

    @Column(name = "blocked_reason", columnDefinition = "text")
    public String blockedReason;

    @Column(name = "blocked_at")
    public Instant blockedAt;

    @Column(name = "blocked_by")
    public UUID blockedBy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "entitlement_plans", nullable = false, columnDefinition = "jsonb")
    public JsonNode entitlementPlans;

    @Column(name = "created_by")
    public UUID createdBy;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;
}
