package com.vn9melody.openerp.modules.plugin.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * UI Slot registry (DES-03-DB section 2.5, BUG-88). Core slots are unique by
 * slot_code; plugin-hosted slots are unique by (owner, slot_code, contract_version).
 * The version manifest stays the source of truth; this table is an index.
 */
@Entity
@Table(name = "plugin_ui_slots")
@RegisterEntity(
    entityName = "PluginUiSlot",
    pluginId = "core-plugin",
    table = "plugin_ui_slots",
    publicFields = {"id", "slot_code", "host_type", "owner_plugin_key", "contract_version", "status"}
)
public class PluginUiSlot extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "slot_code", nullable = false, length = 120)
    public String slotCode;

    @Column(name = "host_type", nullable = false, length = 16)
    public String hostType;

    @Column(name = "owner_plugin_key", length = 100)
    public String ownerPluginKey;

    @Column(name = "declared_in_version", length = 32)
    public String declaredInVersion;

    @Column(name = "title_key", nullable = false, length = 120)
    public String titleKey;

    @Column(name = "contract_version", nullable = false, length = 16)
    public String contractVersion = "1.0";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowed_render_modes", nullable = false, columnDefinition = "jsonb")
    public JsonNode allowedRenderModes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "constraints", nullable = false, columnDefinition = "jsonb")
    public JsonNode constraints;

    @Column(name = "status", nullable = false, length = 16)
    public String status = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;
}
