package com.vn9melody.core.plugin.model;

import com.vn9melody.core.entity.plugin.RuntimeStatus;

public record DeploymentResult(
        String deploymentId,
        String backendBaseUrl,
        String remoteEntryUrl,
        RuntimeStatus status,
        String errorLog) {
}