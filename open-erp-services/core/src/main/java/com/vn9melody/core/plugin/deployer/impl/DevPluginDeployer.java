package com.vn9melody.core.plugin.deployer.impl;

import com.vn9melody.core.entity.plugin.RuntimeStatus;
import com.vn9melody.core.plugin.deployer.PluginDeployer;
import com.vn9melody.core.plugin.model.DeploymentResult;
import com.vn9melody.core.plugin.model.DeploymentTarget;
import com.vn9melody.core.plugin.model.PluginDeploymentContext;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class DevPluginDeployer implements PluginDeployer {

    private final ConcurrentHashMap<String, Process> runningProcesses = new ConcurrentHashMap<>();

    @Override
    public DeploymentTarget target() {
        return DeploymentTarget.DEV;
    }

    @Override
    public DeploymentResult deploy(PluginDeploymentContext context) {
        try {
            if (context.sourceType() == com.vn9melody.core.plugin.model.PluginSourceType.ZIP_BUNDLE) {
                // Chạy java -jar trực tiếp trong tiến trình background
                ProcessBuilder pb = new ProcessBuilder(
                        "java",
                        "-Dquarkus.http.port=" + context.port(),
                        "-jar",
                        context.localExtractedJarPath().toString());
                context.envVars().forEach(pb.environment()::put);
                Process process = pb.start();

                String deploymentId = "dev-" + context.pluginKey();
                runningProcesses.put(deploymentId, process);

                return new DeploymentResult(
                        deploymentId,
                        "http://localhost:" + context.port(),
                        "http://localhost:4200/plugins/" + context.pluginKey() + "/remoteEntry.js",
                        RuntimeStatus.RUNNING,
                        null);
            }
            throw new UnsupportedOperationException(
                    "Chạy Dev không hỗ trợ docker image trực tiếp, vui lòng dùng Docker deployer.");
        } catch (Exception e) {
            return new DeploymentResult(null, null, null, RuntimeStatus.DEGRADED, e.getMessage());
        }
    }

    @Override
    public void undeploy(String pluginKey, String deploymentId) {
        Process process = runningProcesses.remove(deploymentId);
        if (process != null && process.isAlive()) {
            process.destroyForcibly();
        }
    }

    @Override
    public boolean isHealthy(String deploymentId) {
        Process p = runningProcesses.get(deploymentId);
        return p != null && p.isAlive();
    }
}