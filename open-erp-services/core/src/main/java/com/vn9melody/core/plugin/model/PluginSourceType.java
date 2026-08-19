package com.vn9melody.core.plugin.model;

public enum PluginSourceType {
    ZIP_BUNDLE, // File zip chứa jar + dist
    DOCKER_IMAGE // Image registry có sẵn (vd: myrepo/inventory:1.0.0)
}