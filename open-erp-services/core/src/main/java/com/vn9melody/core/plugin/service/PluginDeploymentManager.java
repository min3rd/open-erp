package com.vn9melody.core.plugin.service;

import com.vn9melody.core.entity.plugin.PluginDeployment;
import com.vn9melody.core.entity.plugin.PluginVersion;
import com.vn9melody.core.plugin.deployer.PluginDeployer;
import com.vn9melody.core.plugin.model.DeploymentResult;
import com.vn9melody.core.plugin.model.DeploymentTarget;
import com.vn9melody.core.plugin.model.PluginDeploymentContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;

@ApplicationScoped
public class PluginDeploymentManager {

    @Inject
    Instance<PluginDeployer> deployers;

    @ConfigProperty(name = "plugin.deploy.target", defaultValue = "DEV")
    DeploymentTarget activeTarget;

    @Transactional
    public DeploymentResult executeDeployment(PluginVersion version, PluginDeploymentContext context) {
        // Tìm Deployer tương ứng với môi trường đang chạy
        PluginDeployer deployer = deployers.stream()
                .filter(d -> d.target() == activeTarget)
                .findFirst()
                .orElseThrow(
                        () -> new IllegalStateException("Không tìm thấy deployer cho môi trường: " + activeTarget));

        DeploymentResult result = deployer.deploy(context);

        // Lưu thông tin deployment vào DB
        PluginDeployment deployment = new PluginDeployment();
        deployment.pluginVersion = version;
        deployment.k8sDeploymentName = result.deploymentId();
        deployment.runtimeStatus = result.status();
        deployment.lastErrorLog = result.errorLog();
        deployment.deployedAt = Instant.now();
        deployment.persist();

        return result;
    }
}