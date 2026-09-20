package com.vn9melody.openerp.modules.plugin.deployer;

import java.util.Map;
import java.util.UUID;

/**
 * Runtime deployer abstraction (SOL-02 section 4.1). One container per
 * (tenant, plugin); deployments keep data when undeployed.
 */
public interface PluginRuntimeDeployer {

    record DeployRequest(
            UUID tenantId,
            String pluginKey,
            String version,
            String imageRef,
            String storageSchema,
            Map<String, String> env) {}

    record DeploymentRef(String runtime, String deployment, String service, boolean healthy) {}

    record DeploymentHealth(boolean healthy, String detail) {}

    DeploymentRef deploy(DeployRequest request);

    void undeploy(DeploymentRef ref);

    DeploymentHealth health(DeploymentRef ref);

    void rollback(DeploymentRef ref, DeployRequest previous);
}
