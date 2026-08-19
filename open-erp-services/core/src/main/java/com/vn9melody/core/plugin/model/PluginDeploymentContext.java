package com.vn9melody.core.plugin.model;

import java.nio.file.Path;
import java.util.Map;

public record PluginDeploymentContext(
        String pluginKey,
        String versionTag,
        PluginSourceType sourceType,
        String dockerImage, // Sử dụng khi sourceType = DOCKER_IMAGE
        Path localExtractedJarPath, // Đường dẫn JAR khi sourceType = ZIP_BUNDLE
        Path localExtractedDistPath, // Đường dẫn Angular dist khi sourceType = ZIP_BUNDLE
        int port,
        Map<String, String> envVars) {
}