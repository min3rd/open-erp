package com.vn9melody.openerp.modules.plugin.deployer;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Deployer backed by the Docker CLI (local dev) or a configured process-based
 * runtime (SOL-02 section 4.2). The Kubernetes backend lands in TASK-339 and
 * reuses the same {@link PluginRuntimeDeployer} contract.
 */
@ApplicationScoped
public class ProcessPluginRuntimeDeployer implements PluginRuntimeDeployer {

    @ConfigProperty(name = "openerp.plugin.deployer.runtime", defaultValue = "docker")
    String runtime;

    @ConfigProperty(name = "openerp.plugin.deployer.binary", defaultValue = "docker")
    String binary;

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
            return new DeploymentRef("noop", containerName(request), containerName(request), true);
        }
        if (!"docker".equalsIgnoreCase(runtime)) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_DEPLOY_FAILED,
                    "Unsupported deployer runtime: " + runtime);
        }
        String name = containerName(request);
        runCommand(removeCommand(name), true);
        List<String> command = new ArrayList<>(List.of(binary, "run", "-d", "--name", name,
                "--network", network,
                "--label", "app=open-erp-plugin",
                "--label", "tenant_id=" + request.tenantId(),
                "--label", "plugin_key=" + request.pluginKey(),
                "--label", "plugin_version=" + request.version(),
                "--memory", defaultMemoryMb + "m",
                "--cpus", defaultCpus));
        if (request.env() != null) {
            for (Map.Entry<String, String> entry : request.env().entrySet()) {
                command.add("-e");
                command.add(entry.getKey() + "=" + entry.getValue());
            }
        }
        command.add(request.imageRef());
        runCommand(command, false);
        DeploymentHealth health = health(new DeploymentRef(runtime, name, name, false));
        return new DeploymentRef(runtime, name, name, health.healthy());
    }

    @Override
    public void undeploy(DeploymentRef ref) {
        if (ref == null || isNoop()) {
            return;
        }
        runCommand(removeCommand(ref.deployment()), true);
    }

    @Override
    public DeploymentHealth health(DeploymentRef ref) {
        if (ref == null || isNoop()) {
            return new DeploymentHealth(true, "noop");
        }
        String output = runCommand(List.of(binary, "inspect", "--format", "{{.State.Running}}", ref.deployment()), true);
        boolean running = output != null && output.trim().equalsIgnoreCase("true");
        return new DeploymentHealth(running, running ? "running" : "not running");
    }

    @Override
    public void rollback(DeploymentRef ref, DeployRequest previous) {
        undeploy(ref);
        deploy(previous);
    }

    private List<String> removeCommand(String name) {
        return List.of(binary, "rm", "-f", name);
    }

    private boolean isNoop() {
        return "noop".equalsIgnoreCase(runtime);
    }

    private String containerName(DeployRequest request) {
        String tenantShort = request.tenantId().toString().replace("-", "");
        tenantShort = tenantShort.substring(0, 8);
        String key = request.pluginKey().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "-");
        return ("openerp-plugin-" + key + "-" + tenantShort).substring(0,
                Math.min(63, ("openerp-plugin-" + key + "-" + tenantShort).length()));
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

    public Duration timeout() {
        return Duration.ofSeconds(timeoutSeconds);
    }
}
