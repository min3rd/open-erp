package com.vn9melody.core.entity.plugin;

import jakarta.persistence.*;
import com.vn9melody.common.entity.BaseAuditEntity;

@Entity
@Table(name = "tenant_plugin_bindings", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "tenant_id", "plugin_id" })
})
public class TenantPluginBinding extends BaseAuditEntity {

    @Column(name = "tenant_id", nullable = false)
    public String tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plugin_id")
    public SystemPlugin plugin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "active_version_id")
    public PluginVersion activeVersion;

    @Column(name = "is_enabled", nullable = false)
    public boolean isEnabled = true;

    @Column(name = "custom_config_json", columnDefinition = "TEXT")
    public String customConfigJson;
}