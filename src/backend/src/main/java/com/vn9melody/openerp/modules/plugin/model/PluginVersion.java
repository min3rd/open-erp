package com.vn9melody.openerp.modules.plugin.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.PluginMigrationPolicy;
import com.vn9melody.openerp.core.enums.PluginReleaseStatus;
import com.vn9melody.openerp.core.enums.PluginRollbackStrategy;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Immutable plugin version row (DES-03-DB section 2.2). manifest is the source
 * of truth; distribution carries image ref/checksum/bundle ref.
 */
@Entity
@Table(name = "plugin_versions")
@RegisterEntity(
    entityName = "PluginVersion",
    pluginId = "core-plugin",
    table = "plugin_versions",
    publicFields = {"id", "version", "release_status", "core_compatibility", "migration_policy", "rollback_strategy"}
)
public class PluginVersion extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "catalog_id", nullable = false)
    public UUID catalogId;

    @Column(name = "version", nullable = false, length = 32)
    public String version;

    @Enumerated(EnumType.STRING)
    @Column(name = "release_status", nullable = false, length = 20)
    public PluginReleaseStatus releaseStatus = PluginReleaseStatus.DRAFT;

    @Column(name = "core_compatibility", nullable = false, length = 64)
    public String coreCompatibility;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dependencies", nullable = false, columnDefinition = "jsonb")
    public JsonNode dependencies;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "platforms", nullable = false, columnDefinition = "jsonb")
    public JsonNode platforms;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "permissions", nullable = false, columnDefinition = "jsonb")
    public JsonNode permissions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "entities", nullable = false, columnDefinition = "jsonb")
    public JsonNode entities;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ui_manifest", nullable = false, columnDefinition = "jsonb")
    public JsonNode uiManifest;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "distribution", nullable = false, columnDefinition = "jsonb")
    public JsonNode distribution;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "manifest", nullable = false, columnDefinition = "jsonb")
    public JsonNode manifest;

    @Enumerated(EnumType.STRING)
    @Column(name = "migration_policy", nullable = false, length = 16)
    public PluginMigrationPolicy migrationPolicy = PluginMigrationPolicy.COMPATIBLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "rollback_strategy", nullable = false, length = 20)
    public PluginRollbackStrategy rollbackStrategy = PluginRollbackStrategy.SNAPSHOT_RESTORE;

    @Column(name = "template_version", length = 32)
    public String templateVersion;

    @Column(name = "created_by")
    public UUID createdBy;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "published_at")
    public Instant publishedAt;

    @Column(name = "publish_reason", columnDefinition = "text")
    public String publishReason;

    @Column(name = "block_reason", columnDefinition = "text")
    public String blockReason;

    @Column(name = "blocked_at")
    public Instant blockedAt;
}
