package com.vn9melody.openerp.modules.plugin.artifact;


import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Builds a platform runtime image from a JAR bundle (TASK-334, SOL-02 4.3):
 * Docker daemon for local/dev, Kaniko Job for Kubernetes, no-op for tests.
 * The image is tenant-independent; it is built once per (plugin, version).
 */
@ApplicationScoped
public class PluginImageBuilder {

    private static final Logger LOG = Logger.getLogger(PluginImageBuilder.class);

    @Inject
    ArtifactStorage artifactStorage;

    @ConfigProperty(name = "openerp.plugin.image-builder", defaultValue = "docker")
    String builderRuntime;

    @ConfigProperty(name = "openerp.plugin.internal-registry", defaultValue = "openerp-registry.local")
    String internalRegistry;

    @ConfigProperty(name = "openerp.plugin.builder.docker-binary", defaultValue = "docker")
    String dockerBinary;

    @ConfigProperty(name = "openerp.plugin.builder.kubectl-binary", defaultValue = "kubectl")
    String kubectlBinary;

    @ConfigProperty(name = "openerp.plugin.builder.namespace", defaultValue = "default")
    String namespace;

    @ConfigProperty(name = "openerp.plugin.builder.kaniko-image",
            defaultValue = "gcr.io/kaniko-project/executor:v1.23.2")
    String kanikoImage;

    @ConfigProperty(name = "openerp.plugin.builder.kaniko-context-dir",
            defaultValue = "/workspace/plugin-contexts")
    String kanikoContextDir;

    @ConfigProperty(name = "openerp.plugin.builder.push", defaultValue = "true")
    boolean pushImage;

    @ConfigProperty(name = "openerp.plugin.builder.timeout-seconds", defaultValue = "600")
    int timeoutSeconds;

    @ConfigProperty(name = "openerp.plugin.max-artifact-size-mb", defaultValue = "512")
    int maxArtifactSizeMb;

    @ConfigProperty(name = "openerp.plugin.builder.base-image", defaultValue = "eclipse-temurin:21-jre")
    String baseImage;

    public String imageName(String pluginKey, String version) {
        return internalRegistry + "/" + pluginKey.toLowerCase() + ":" + version;
    }

    public String build(String pluginKey, String version, String artifactRef) {
        String imageName = imageName(pluginKey, version);
        if ("noop".equalsIgnoreCase(builderRuntime)) {
            return imageName;
        }
        if (artifactRef == null || artifactRef.isBlank()) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                    "Version has no bundle artifact to build from");
        }
        Path context = null;
        try {
            context = Files.createTempDirectory("plugin-image-" + pluginKey + "-");
            extractBundle(artifactRef, context);
            Files.createDirectories(context.resolve("static"));
            Files.writeString(context.resolve("Dockerfile"), dockerfile(pluginKey, version), StandardCharsets.UTF_8);
            if ("kaniko".equalsIgnoreCase(builderRuntime)) {
                return kanikoBuild(pluginKey, version, imageName, context);
            }
            if (!"docker".equalsIgnoreCase(builderRuntime)) {
                throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                        "Unsupported image builder: " + builderRuntime);
            }
            return dockerBuild(pluginKey, version, imageName, context);
        } catch (IOException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                    "Image build failed: " + e.getMessage());
        } finally {
            deleteRecursively(context);
        }
    }

    private void extractBundle(String artifactRef, Path context) throws IOException {
        long limit = (long) maxArtifactSizeMb * 1024 * 1024;
        long total = 0;
        boolean sawJar = false;
        try (InputStream stream = artifactStorage.open(artifactRef);
             ZipInputStream zip = new ZipInputStream(stream)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                total += Math.max(entry.getSize(), 0);
                if (total > limit) {
                    throw new ApiException(413, PluginErrorCode.PLUGIN_ARTIFACT_TOO_LARGE,
                            "Bundle exceeds " + maxArtifactSizeMb + "MB");
                }
                if (entry.isDirectory()) {
                    continue;
                }
                String name = entry.getName();
                if (name.contains("..") || name.startsWith("/") || name.contains("\\")) {
                    throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST,
                            "Bundle entry has an unsafe path: " + name);
                }
                Path target;
                if (!sawJar && name.toLowerCase().endsWith(".jar")) {
                    sawJar = true;
                    target = context.resolve("app.jar");
                } else {
                    target = context.resolve(name);
                }
                Files.createDirectories(target.getParent());
                Files.copy(zip, target, StandardCopyOption.REPLACE_EXISTING);
            }
        }
        if (!sawJar) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                    "Bundle contains no application JAR");
        }
    }

    private String dockerBuild(String pluginKey, String version, String imageName, Path context) {
        runCommand(List.of(dockerBinary, "build", "--label", "plugin_key=" + pluginKey,
                "--label", "plugin_version=" + version, "-t", imageName, context.toString()), false);
        if (pushImage) {
            runCommand(List.of(dockerBinary, "push", imageName), false);
        }
        LOG.infof("Built plugin image %s from bundle", imageName);
        return imageName;
    }

    private String kanikoBuild(String pluginKey, String version, String imageName, Path context) {
        try {
            Path contextDir = Path.of(kanikoContextDir);
            Files.createDirectories(contextDir);
            String tarName = pluginKey + "-" + version + ".tar.gz";
            Path tar = contextDir.resolve(tarName);
            runCommand(List.of("tar", "-czf", tar.toString(), "-C", context.toString(), "."), false);

            String jobName = "plugin-build-" + pluginKey.toLowerCase() + "-" + version.replace('.', '-');
            Path manifest = Files.createTempFile("plugin-build-", ".yaml");
            try {
                Files.writeString(manifest, kanikoJob(jobName, pluginKey, version, imageName, tarName),
                        StandardCharsets.UTF_8);
                runCommand(List.of(kubectlBinary, "apply", "-n", namespace, "-f", manifest.toString()), false);
            } finally {
                Files.deleteIfExists(manifest);
            }
            awaitJob(jobName);
            runCommand(List.of(kubectlBinary, "delete", "-n", namespace, "job/" + jobName,
                    "--ignore-not-found", "--wait=false"), true);
            LOG.infof("Kaniko built plugin image %s", imageName);
            return imageName;
        } catch (IOException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                    "Kaniko build failed: " + e.getMessage());
        }
    }

    private void awaitJob(String jobName) {
        long deadline = System.currentTimeMillis() + timeoutSeconds * 1000L;
        while (System.currentTimeMillis() < deadline) {
            String output = runCommand(List.of(kubectlBinary, "get", "job", jobName, "-n", namespace,
                    "-o", "jsonpath={.status.succeeded}/{.status.failed}"), true);
            if (output != null && output.startsWith("1/")) {
                return;
            }
            if (output != null && output.endsWith("/1")) {
                throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                        "Kaniko job " + jobName + " failed; inspect logs via kubectl logs job/" + jobName);
            }
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED, "Kaniko build interrupted");
            }
        }
        throw new ApiException(504, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                "Kaniko job " + jobName + " timed out after " + timeoutSeconds + "s");
    }

    private String dockerfile(String pluginKey, String version) {
        return """
                FROM %s
                LABEL plugin_key="%s" plugin_version="%s" managed-by="plugin-manager"
                WORKDIR /app
                COPY app.jar /app/app.jar
                COPY static /app/static
                ENV QUARKUS_HTTP_PORT=8080
                EXPOSE 8080
                ENTRYPOINT ["java", "-jar", "/app/app.jar"]
                """.formatted(baseImage, pluginKey, version);
    }

    private String kanikoJob(String jobName, String pluginKey, String version, String imageName, String tarName) {
        return """
                apiVersion: batch/v1
                kind: Job
                metadata:
                  name: %s
                  labels:
                    app: open-erp-plugin-build
                    plugin_key: %s
                spec:
                  backoffLimit: 0
                  ttlSecondsAfterFinished: 3600
                  template:
                    metadata:
                      labels:
                        app: open-erp-plugin-build
                        plugin_key: %s
                    spec:
                      restartPolicy: Never
                      containers:
                        - name: kaniko
                          image: %s
                          args:
                            - --context=tar:///workspace/contexts/%s
                            - --dockerfile=Dockerfile
                            - --destination=%s
                          volumeMounts:
                            - name: contexts
                              mountPath: /workspace/contexts
                          resources:
                            limits:
                              cpu: "1"
                              memory: 1Gi
                      volumes:
                        - name: contexts
                          hostPath:
                            path: %s
                            type: Directory
                """.formatted(jobName, pluginKey, pluginKey, kanikoImage, tarName, imageName, kanikoContextDir);
    }

    private String runCommand(List<String> command, boolean allowFailure) {
        try {
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new ApiException(504, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                        "Builder command timed out: " + command.get(0));
            }
            if (process.exitValue() != 0 && !allowFailure) {
                throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                        "Builder command failed: " + truncate(output));
            }
            return output;
        } catch (IOException e) {
            if (allowFailure) {
                return null;
            }
            throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED,
                    "Builder binary unavailable: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(500, PluginErrorCode.PLUGIN_IMAGE_BUILD_FAILED, "Builder command interrupted");
        }
    }

    private void deleteRecursively(Path root) {
        if (root == null) {
            return;
        }
        try (var paths = Files.walk(root)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // best-effort temp cleanup
                }
            });
        } catch (IOException ignored) {
            // best-effort temp cleanup
        }
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 500 ? value.substring(0, 500) : value;
    }
}
