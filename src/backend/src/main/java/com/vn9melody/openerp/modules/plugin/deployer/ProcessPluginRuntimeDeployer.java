package com.vn9melody.openerp.modules.plugin.deployer;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Process-based deployer (TASK-338/339): Docker CLI for local dev, kubectl for
 * Kubernetes staging/production, and a no-op runtime for %test.
 */
@ApplicationScoped
public class ProcessPluginRuntimeDeployer implements PluginRuntimeDeployer {

    @ConfigProperty(name = "openerp.plugin.deployer.runtime", defaultValue = "docker")
    String runtime;

    @ConfigProperty(name = "openerp.plugin.deployer.binary", defaultValue = "docker")
    String binary;

    @ConfigProperty(name = "openerp.plugin.deployer.kubectl-binary", defaultValue = "kubectl")
    String kubectlBinary;

    @ConfigProperty(name = "openerp.plugin.deployer.namespace", defaultValue = "default")
    String namespace;

    @ConfigProperty(name = "openerp.plugin.runtime-network", defaultValue = "openerp-net")
    String network;

    @ConfigProperty(name = "openerp.plugin.resources.default-memory-mb", defaultValue = "512")
    int defaultMemoryMb;

    @ConfigProperty(name = "openerp.plugin.resources.default-cpus", defaultValue = "0.5")
    String defaultCpus;

    @ConfigProperty(name = "openerp.plugin.deployer.timeout-seconds", defaultValue = "90")
    int timeoutSeconds;

    @Override
    public DeploymentRef deploy(DeployRequest request) {
        if (isNoop()) {
            return new DeploymentRef("noop", resourceName(request), resourceName(request), true);
        }
        if ("kubernetes".equalsIgnoreCase(runtime)) {
            return deployKubernetes(request);
        }
        if (!"docker".equalsIgnoreCase(runtime)) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED,
                    "Unsupported deployer runtime: " + runtime);
        }
        return deployDocker(request);
    }

    private DeploymentRef deployDocker(DeployRequest request) {
        String name = resourceName(request);
        runCommand(List.of(binary, "rm", "-f", name), true);
        List<String> command = new ArrayList<>(List.of(binary, "run", "-d", "--name", name,
                "--network", network,
                "--label", "app=open-erp-plugin",
                "--label", "tenant_id=" + request.tenantId(),
                "--label", "plugin_key=" + request.pluginKey(),
                "--label", "plugin_version=" + request.version(),
                "--memory", defaultMemoryMb + "m",
                "--cpus", defaultCpus));
        appendEnv(command, request);
        command.add(request.imageRef());
        runCommand(command, false);
        DeploymentHealth health = health(new DeploymentRef("docker", name, name, false));
        return new DeploymentRef("docker", name, name, health.healthy());
    }

    private DeploymentRef deployKubernetes(DeployRequest request) {
        String name = resourceName(request);
        Path manifest = null;
        try {
            manifest = Files.createTempFile("plugin-deploy-", ".yaml");
            Files.writeString(manifest, kubernetesManifest(request, name), StandardCharsets.UTF_8);
            runCommand(List.of(kubectlBinary, "apply", "-n", namespace, "-f", manifest.toString()), false);
            DeploymentHealth health = health(new DeploymentRef("kubernetes", name, name, false));
            return new DeploymentRef("kubernetes", name, name, health.healthy());
        } catch (IOException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED,
                    "Cannot write Kubernetes manifest: " + e.getMessage());
        } finally {
            if (manifest != null) {
                try {
                    Files.deleteIfExists(manifest);
                } catch (IOException ignored) {
                    // temp file cleanup best effort
                }
            }
        }
    }

    @Override
    public void undeploy(DeploymentRef ref) {
        if (ref == null || "noop".equalsIgnoreCase(ref.runtime())) {
            return;
        }
        if ("kubernetes".equalsIgnoreCase(ref.runtime())) {
            runCommand(List.of(kubectlBinary, "delete", "-n", namespace,
                    "deployment/" + ref.deployment(), "service/" + ref.service(),
                    "--ignore-not-found", "--wait=false"), true);
            return;
        }
        runCommand(List.of(binary, "rm", "-f", ref.deployment()), true);
    }

    @Override
    public DeploymentHealth health(DeploymentRef ref) {
        if (ref == null) {
            return new DeploymentHealth(false, "missing ref");
        }
        if ("noop".equalsIgnoreCase(ref.runtime())) {
            return new DeploymentHealth(true, "noop");
        }
        if ("kubernetes".equalsIgnoreCase(ref.runtime())) {
            String output = runCommand(List.of(kubectlBinary, "get", "deployment", ref.deployment(),
                    "-n", namespace, "-o", "jsonpath={.status.readyReplicas}"), true);
            int ready = parseReadyReplicas(output);
            return new DeploymentHealth(ready >= 1, "ready_replicas=" + ready);
        }
        String output = runCommand(List.of(binary, "inspect", "--format", "{{.State.Running}}",
                ref.deployment()), true);
        boolean running = output != null && output.trim().equalsIgnoreCase("true");
        return new DeploymentHealth(running, running ? "running" : "not running");
    }

    @Override
    public void rollback(DeploymentRef ref, DeployRequest previous) {
        undeploy(ref);
        deploy(previous);
    }

    public String namespace() {
        return namespace;
    }

    private void appendEnv(List<String> command, DeployRequest request) {
        if (request.env() == null) {
            return;
        }
        for (Map.Entry<String, String> entry : request.env().entrySet()) {
            command.add("-e");
            command.add(entry.getKey() + "=" + entry.getValue());
        }
    }

    private String kubernetesManifest(DeployRequest request, String name) {
        StringBuilder env = new StringBuilder();
        if (request.env() != null) {
            for (Map.Entry<String, String> entry : request.env().entrySet()) {
                env.append("            - name: ").append(entry.getKey()).append('\n')
                        .append("              value: \"").append(entry.getValue().replace("\"", "")).append("\"\n");
            }
        }
        return """
                apiVersion: apps/v1
                kind: Deployment
                metadata:
                  name: %s
                  labels:
                    app: open-erp-plugin
                    tenant_id: "%s"
                    plugin_key: %s
                spec:
                  replicas: 1
                  selector:
                    matchLabels:
                      app: open-erp-plugin
                      tenant_id: "%s"
                      plugin_key: %s
                  template:
                    metadata:
                      labels:
                        app: open-erp-plugin
                        tenant_id: "%s"
                        plugin_key: %s
                        plugin_version: %s
                        managed-by: plugin-manager
                    spec:
                      containers:
                        - name: plugin
                          image: %s
                          ports:
                            - containerPort: 8080
                          env:
                %s          readinessProbe:
                            httpGet:
                              path: /q/health/ready
                              port: 8080
                            initialDelaySeconds: 5
                          livenessProbe:
                            httpGet:
                              path: /q/health/live
                              port: 8080
                          resources:
                            limits:
                              cpu: "%s"
                              memory: "%sMi"
                ---
                apiVersion: v1
                kind: Service
                metadata:
                  name: %s
                  labels:
                    app: open-erp-plugin
                    plugin_key: %s
                spec:
                  selector:
                    app: open-erp-plugin
                    tenant_id: "%s"
                    plugin_key: %s
                  ports:
                    - port: 8080
                      targetPort: 8080
                """.formatted(name, request.tenantId(), request.pluginKey(),
                request.tenantId(), request.pluginKey(),
                request.tenantId(), request.pluginKey(), request.version(),
                request.imageRef(), env.toString().isBlank() ? "            []\n" : env.toString(),
                defaultCpus, defaultMemoryMb,
                name, request.pluginKey(), request.tenantId(), request.pluginKey());
    }

    private int parseReadyReplicas(String output) {
        if (output == null || output.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(output.trim().replace("\"", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String resourceName(DeployRequest request) {
        String tenantShort = request.tenantId().toString().replace("-", "").substring(0, 8);
        String key = request.pluginKey().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "-");
        String name = "openerp-plugin-" + key + "-" + tenantShort;
        return name.length() > 63 ? name.substring(0, 63) : name;
    }

    private String runCommand(List<String> command, boolean allowFailure) {
        try {
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new ApiException(504, PluginErrorCode.PLUGIN_DEPLOY_FAILED, "Deployer command timed out");
            }
            int exit = process.exitValue();
            if (exit != 0 && !allowFailure) {
                throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED,
                        "Deployer command failed: " + truncate(output));
            }
            return output;
        } catch (IOException e) {
            if (allowFailure) {
                return null;
            }
            throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED,
                    "Deployer binary unavailable: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED, "Deployer command interrupted");
        }
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private boolean isNoop() {
        return "noop".equalsIgnoreCase(runtime);
    }
}
