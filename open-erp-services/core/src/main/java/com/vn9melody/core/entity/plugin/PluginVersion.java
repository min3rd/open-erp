package com.vn9melody.core.entity.plugin;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;

import com.vn9melody.common.entity.BaseAuditEntity;

@Entity
@Table(name = "plugin_versions", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "plugin_id", "version_tag" })
})
public class PluginVersion extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plugin_id")
    public SystemPlugin plugin;

    @Column(name = "version_tag", nullable = false, length = 50)
    public String versionTag;

    @Column(name = "min_core_version", length = 50)
    public String minCoreVersion;

    @Column(name = "storage_zip_path", nullable = false)
    public String storageZipPath;

    @Column(name = "backend_jar_path")
    public String backendJarPath;

    @Column(name = "frontend_dist_path")
    public String frontendDistPath;

    @Column(name = "raw_manifest", columnDefinition = "TEXT")
    public String rawManifest;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    public PluginVersionStatus status = PluginVersionStatus.DRAFT;

    @OneToMany(mappedBy = "pluginVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<PluginMenu> menus;

    @OneToMany(mappedBy = "pluginVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<PluginRoute> routes;
}