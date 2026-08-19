package com.vn9melody.core.entity.plugin;

import jakarta.persistence.*;
import java.util.List;
import com.vn9melody.common.entity.BaseAuditEntity;

@Entity
@Table(name = "plugins")
public class SystemPlugin extends BaseAuditEntity {

    @Column(name = "plugin_key", unique = true, nullable = false, length = 100)
    public String pluginKey; // vd: "inventory-management", "hr-payroll"

    @Column(name = "display_name", nullable = false, length = 200)
    public String displayName;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(name = "category", length = 50)
    public String category; // vd: "FINANCE", "SCM", "HRM"

    @Column(name = "icon_url")
    public String iconUrl;

    @Column(name = "author", length = 100)
    public String author;

    @Column(name = "is_system", nullable = false)
    public boolean isSystem = false;

    @OneToMany(mappedBy = "plugin", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<PluginVersion> versions;
}