package com.vn9melody.openerp.modules.plugin.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.PluginStorageModel;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Single source of truth for tenant plugin entitlement + lifecycle + pinned
 * version + deployment info (DES-03-DB section 2.3). One row per
 * (tenant_id, plugin_key).
 */
@Entity
@Table(name = "tenant_plugins")
@RegisterEntity(
    entityName = "TenantPlugin",
    pluginId = "core-plugin",
    table = "tenant_plugins",
    publicFields = {"id", "tenant_id", "plugin_key", "status", "installed_version", "storage_model"}
)
public class TenantPlugin extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "catalog_id", nullable = false)
    public UUID catalogId;

    @Column(name = "plugin_key", nullable = false, length = 100)
    public String pluginKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    public TenantPluginStatus status = TenantPluginStatus.NOT_INSTALLED;

    @Column(name = "installed_version", length = 32)
    public String installedVersion;

    @Column(name = "target_version", length = 32)
    public String targetVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_model", nullable = false, length = 24)
    public PluginStorageModel storageModel = PluginStorageModel.DEDICATED_SCHEMA;

    @Column(name = "storage_schema", length = 63)
    public String storageSchema;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "deploy_ref", nullable = false, columnDefinition = "jsonb")
    public JsonNode deployRef = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

    @Column(name = "last_error_code", length = 80)
    public String lastErrorCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "last_error_params", columnDefinition = "jsonb")
    public JsonNode lastErrorParams;

    @Column(name = "operation_id")
    public UUID operationId;

    @Version
    @Column(name = "row_version", nullable = false)
    public int rowVersion = 0;

    @Column(name = "installed_at")
    public Instant installedAt;

    @Column(name = "activated_at")
    public Instant activatedAt;

    @Column(name = "uninstalled_at")
    public Instant uninstalledAt;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;
}
