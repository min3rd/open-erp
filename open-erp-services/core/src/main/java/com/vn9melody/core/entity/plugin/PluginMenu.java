package com.vn9melody.core.entity.plugin;

import jakarta.persistence.*;

import com.vn9melody.common.entity.BaseAuditEntity;

@Entity
@Table(name = "plugin_menus")
public class PluginMenu extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id")
    public PluginVersion pluginVersion;

    @Column(name = "title", nullable = false, length = 100)
    public String title;

    @Column(name = "icon", length = 50)
    public String icon;

    @Column(name = "router_link", length = 200)
    public String routerLink;

    @Column(name = "sort_order")
    public Integer sortOrder = 0;

    @Column(name = "parent_menu_code", length = 100)
    public String parentMenuCode;

    @Column(name = "required_permission", length = 100)
    public String requiredPermission;
}