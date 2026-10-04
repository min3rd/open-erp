package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.artifact.ArtifactStorage;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Schema snapshot + restore for tenant plugin datasources (TASK-310 / BUG-86).
 * Uses pg_dump/psql against the tenant schema; artifacts are stored through
 * {@link ArtifactStorage} (local now, MinIO in TASK-335).
 */
@ApplicationScoped
public class PluginSnapshotService {

    private static final Logger LOG = Logger.getLogger(PluginSnapshotService.class);

    @Inject
    ArtifactStorage artifactStorage;

    @ConfigProperty(name = "openerp.plugin.snapshot.pg-dump-binary", defaultValue = "pg_dump")
    String pgDumpBinary;

    @ConfigProperty(name = "openerp.plugin.snapshot.psql-binary", defaultValue = "psql")
    String psqlBinary;

    @ConfigProperty(name = "openerp.plugin.snapshot.timeout-seconds", defaultValue = "300")
    int timeoutSeconds;

    @ConfigProperty(name = "quarkus.datasource.jdbc.url")
    String jdbcUrl;

    @ConfigProperty(name = "quarkus.datasource.username")
    String dbUser;

    @ConfigProperty(name = "quarkus.datasource.password")
    String dbPassword;

    public record SnapshotRef(String ref, String checksum, Instant takenAt) {}

    public SnapshotRef snapshot(UUID tenantId, String pluginKey, String version, String schema, String kind) {
        String fileName = kind + "-" + pluginKey + "-" + version + ".dump";
        List<String> command = new ArrayList<>(List.of(
                pgDumpBinary,
                "--dbname", jdbcUrl.replace("jdbc:", ""),
                "--username", dbUser,
                "--schema", schema,
                "--no-owner",
                "--no-privileges",
                "--clean",
                "--if-exists"));
        try {
            Process process = new ProcessBuilder(command)
                    .redirectErrorStream(false)
                    .start();
            process.getOutputStream().close();
            byte[] stdout = process.getInputStream().readAllBytes();
            String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new ApiException(504, PluginErrorCode.PLUGIN_SNAPSHOT_FAILED, "Snapshot timed out");
            }
            if (process.exitValue() != 0) {
                throw new ApiException(500, PluginErrorCode.PLUGIN_SNAPSHOT_FAILED,
                        "pg_dump failed: " + truncate(stderr));
            }
            ArtifactStorage.StoredArtifact stored = artifactStorage.store(fileName,
                    new java.io.ByteArrayInputStream(stdout));
            return new SnapshotRef(stored.ref(), stored.checksum(), Instant.now());
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            LOG.errorf("Snapshot failed for %s/%s: %s", tenantId, pluginKey, e.getMessage());
            throw new ApiException(500, PluginErrorCode.PLUGIN_SNAPSHOT_FAILED,
                    "Snapshot tooling unavailable: " + e.getMessage());
        }
    }

    public void restore(String ref) {
        if (ref == null || ref.isBlank()) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_SNAPSHOT_MISSING, "Snapshot reference is required");
        }
        Path tempFile = null;
        try (InputStream content = artifactStorage.open(ref)) {
            tempFile = Files.createTempFile("plugin-restore-", ".dump");
            Files.copy(content, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            List<String> command = List.of(
                    psqlBinary,
                    "--dbname", jdbcUrl.replace("jdbc:", ""),
                    "--username", dbUser,
                    "--file", tempFile.toString(),
                    "--single-transaction");
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            process.getOutputStream().close();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new ApiException(504, PluginErrorCode.PLUGIN_RESTORE_SNAPSHOT_FAILED, "Restore timed out");
            }
            if (process.exitValue() != 0) {
                throw new ApiException(500, PluginErrorCode.PLUGIN_RESTORE_SNAPSHOT_FAILED,
                        "psql restore failed: " + truncate(output));
            }
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiException(500, PluginErrorCode.PLUGIN_RESTORE_SNAPSHOT_FAILED,
                    "Restore failed: " + e.getMessage());
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                    LOG.warnf("Unable to delete temporary snapshot file %s", tempFile);
                }
            }
        }
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }
}
