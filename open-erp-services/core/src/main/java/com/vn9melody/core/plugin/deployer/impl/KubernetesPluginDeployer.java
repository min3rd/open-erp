package com.vn9melody.core.plugin.deployer.impl;

import com.vn9melody.core.entity.plugin.RuntimeStatus;
import com.vn9melody.core.plugin.deployer.PluginDeployer;
import com.vn9melody.core.plugin.model.DeploymentResult;
import com.vn9melody.core.plugin.model.DeploymentTarget;
import com.vn9melody.core.plugin.model.PluginDeploymentContext;
import com.vn9melody.core.plugin.model.PluginSourceType;
import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.apps.DeploymentBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class KubernetesPluginDeployer implements PluginDeployer {

    @Inject
    KubernetesClient k8sClient;

    @ConfigProperty(name = "quarkus.kubernetes-client.namespace", defaultValue = "default")
    String namespace;

    @ConfigProperty(name = "plugin.k8s.pvc-name", defaultValue = "plugins-shared-pvc")
    String sharedPvcName;

    @Override
    public DeploymentTarget target() {
        return DeploymentTarget.KUBERNETES;
    }

    @Override
    public DeploymentResult deploy(PluginDeploymentContext context) {
        String name = "plugin-" + context.pluginKey();
        try {
            String image = context.sourceType() == PluginSourceType.DOCKER_IMAGE
                    ? context.dockerImage()
                    : "eclipse-temurin:21-jre-alpine";

            List<EnvVar> envVars = new ArrayList<>();
            context.envVars().forEach((k, v) -> envVars.add(new EnvVar(k, v, null)));

            ContainerBuilder containerBuilder = new ContainerBuilder()
                    .withName(name)
                    .withImage(image)
                    .withEnv(envVars)
                    .addNewPort().withContainerPort(8080).endPort();

            List<Volume> volumes = new ArrayList<>();
            if (context.sourceType() == PluginSourceType.ZIP_BUNDLE) {
                // Mount file JAR từ PVC dùng chung
                containerBuilder.withCommand("java", "-jar", "/deployments/app.jar")
                        .addNewVolumeMount()
                        .withName("shared-storage")
                        .withMountPath("/deployments/app.jar")
                        .withSubPath(context.pluginKey() + "/" + context.versionTag() + "/backend/app.jar")
                        .endVolumeMount();

                volumes.add(new VolumeBuilder()
                        .withName("shared-storage")
                        .withNewPersistentVolumeClaim().withClaimName(sharedPvcName).endPersistentVolumeClaim()
                        .build());
            }

            // 1. Tạo Deployment
            Deployment deployment = new DeploymentBuilder()
                    .withNewMetadata().withName(name).withNamespace(namespace).addToLabels("app", name).endMetadata()
                    .withNewSpec()
                    .withReplicas(1)
                    .withNewSelector().addToMatchLabels("app", name).endSelector()
                    .withNewTemplate()
                    .withNewMetadata().addToLabels("app", name).endMetadata()
                    .withNewSpec()
                    .withContainers(containerBuilder.build())
                    .withVolumes(volumes)
                    .endSpec()
                    .endTemplate()
                    .endSpec()
                    .build();

            k8sClient.apps().deployments().inNamespace(namespace).resource(deployment).serverSideApply();

            // 2. Tạo Service
            Service service = new ServiceBuilder()
                    .withNewMetadata().withName(name).withNamespace(namespace).endMetadata()
                    .withNewSpec()
                    .addToSelector("app", name)
                    .addNewPort().withPort(8080).withTargetPort(new IntOrString(8080)).endPort()
                    .endSpec()
                    .build();

            k8sClient.services().inNamespace(namespace).resource(service).serverSideApply();

            return new DeploymentResult(
                    name,
                    "http://" + name + "." + namespace + ".svc.cluster.local:8080",
                    "/plugins/" + context.pluginKey() + "/remoteEntry.js",
                    RuntimeStatus.RUNNING,
                    null);
        } catch (Exception e) {
            return new DeploymentResult(null, null, null, RuntimeStatus.DEGRADED, e.getMessage());
        }
    }

    @Override
    public void undeploy(String pluginKey, String deploymentId) {
        k8sClient.apps().deployments().inNamespace(namespace).withName(deploymentId).delete();
        k8sClient.services().inNamespace(namespace).withName(deploymentId).delete();
    }

    @Override
    public boolean isHealthy(String deploymentId) {
        Deployment d = k8sClient.apps().deployments().inNamespace(namespace).withName(deploymentId).get();
        if (d == null || d.getStatus() == null)
            return false;
        Integer ready = d.getStatus().getReadyReplicas();
        return ready != null && ready > 0;
    }
}