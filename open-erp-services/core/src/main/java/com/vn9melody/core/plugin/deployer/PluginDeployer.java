package com.vn9melody.core.plugin.deployer;

import com.vn9melody.core.plugin.model.DeploymentResult;
import com.vn9melody.core.plugin.model.DeploymentTarget;
import com.vn9melody.core.plugin.model.PluginDeploymentContext;

public interface PluginDeployer {

    DeploymentTarget target();

    DeploymentResult deploy(PluginDeploymentContext context);

    void undeploy(String pluginKey, String deploymentId);

    boolean isHealthy(String deploymentId);
}