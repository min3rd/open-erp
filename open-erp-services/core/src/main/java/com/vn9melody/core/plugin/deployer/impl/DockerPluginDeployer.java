package com.vn9melody.core.plugin.deployer.impl;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.vn9melody.core.entity.plugin.RuntimeStatus;
import com.vn9melody.core.plugin.deployer.PluginDeployer;
import com.vn9melody.core.plugin.model.DeploymentResult;
import com.vn9melody.core.plugin.model.DeploymentTarget;
import com.vn9melody.core.plugin.model.PluginDeploymentContext;
import com.vn9melody.core.plugin.model.PluginSourceType;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class DockerPluginDeployer implements PluginDeployer {

    private DockerClient dockerClient;

    @PostConstruct
    void init() {
        var config = DefaultDockerClientConfig.createDefaultConfigBuilder().build();
        var httpClient = new ApacheDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .build();
        this.dockerClient = DockerClientImpl.getInstance(config, httpClient);
    }

    @Override
    public DeploymentTarget target() {
        return DeploymentTarget.DOCKER;
    }

    @Override
    public DeploymentResult deploy(PluginDeploymentContext context) {
        try {
            String containerName = "plugin-" + context.pluginKey();
            String image = context.sourceType() == PluginSourceType.DOCKER_IMAGE
                    ? context.dockerImage()
                    : "eclipse-temurin:21-jre-alpine";

            List<String> envList = new ArrayList<>();
            context.envVars().forEach((k, v) -> envList.add(k + "=" + v));

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withPortBindings(PortBinding.parse(context.port() + ":8080"))
                    .withNetworkMode("erp-network");

            // Nếu là file ZIP -> Mount file jar vào runner image
            if (context.sourceType() == PluginSourceType.ZIP_BUNDLE) {
                hostConfig.withBinds(new Bind(context.localExtractedJarPath().toString(), new Volume("/app/app.jar")));
            }

            CreateContainerResponse container = dockerClient.createContainerCmd(image)
                    .withName(containerName)
                    .withHostConfig(hostConfig)
                    .withEnv(envList)
                    .withCmd(context.sourceType() == PluginSourceType.ZIP_BUNDLE
                            ? List.of("java", "-jar", "/app/app.jar")
                            : List.of())
                    .exec();

            dockerClient.startContainerCmd(container.getId()).exec();

            return new DeploymentResult(
                    container.getId(),
                    "http://localhost:" + context.port(),
                    "/plugins/" + context.pluginKey() + "/remoteEntry.js",
                    RuntimeStatus.RUNNING,
                    null);
        } catch (Exception e) {
            return new DeploymentResult(null, null, null, RuntimeStatus.DEGRADED, e.getMessage());
        }
    }

    @Override
    public void undeploy(String pluginKey, String containerId) {
        try {
            dockerClient.stopContainerCmd(containerId).exec();
            dockerClient.removeContainerCmd(containerId).withForce(true).exec();
        } catch (Exception ignored) {
        }
    }

    @Override
    public boolean isHealthy(String containerId) {
        try {
            var inspect = dockerClient.inspectContainerCmd(containerId).exec();
            return Boolean.TRUE.equals(inspect.getState().getRunning());
        } catch (Exception e) {
            return false;
        }
    }
}