package com.vn9melody.core.entity.plugin;

import jakarta.persistence.*;

import com.vn9melody.common.entity.BaseAuditEntity;

@Entity
@Table(name = "plugin_routes")
public class PluginRoute extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id")
    public PluginVersion pluginVersion;

    @Column(name = "route_path", nullable = false, length = 100)
    public String routePath;

    @Column(name = "remote_entry_url", nullable = false, length = 255)
    public String remoteEntryUrl;

    @Column(name = "remote_name", nullable = false, length = 100)
    public String remoteName;

    @Column(name = "exposed_module", nullable = false, length = 100)
    public String exposedModule;

    @Column(name = "api_context_path", length = 150)
    public String apiContextPath;
}