package com.vn9melody.openerp.modules.plugin.artifact;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import io.quarkus.arc.properties.IfBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Development artifact storage on the local filesystem. Replaced by the MinIO
 * implementation when profile {@code storage} is enabled (TASK-335).
 */
@ApplicationScoped
@IfBuildProperty(name = "openerp.storage.provider", stringValue = "local", enableIfMissing = true)
public class LocalArtifactStorage implements ArtifactStorage {

    @ConfigProperty(name = "openerp.plugin.artifact.local-dir",
            defaultValue = "openerp-plugin-artifacts")
    String baseDir;

    @Override
    public StoredArtifact store(String fileName, InputStream content) {
        String safeName = fileName == null || fileName.isBlank() ? "artifact.zip"
                : fileName.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "_");
        String id = UUID.randomUUID().toString();
        try {
            Path directory = basePath().resolve(id);
            Files.createDirectories(directory);
            Path target = directory.resolve(safeName);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (DigestInputStream digestStream = new DigestInputStream(content, digest)) {
                Files.copy(digestStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String checksum = HexFormat.of().formatHex(digest.digest());
            return new StoredArtifact("local://" + id + "/" + safeName, checksum, Files.size(target));
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Cannot store artifact: " + e.getMessage());
        }
    }

    @Override
    public InputStream open(String ref) {
        if (ref == null || !ref.startsWith("local://")) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID, "Unknown artifact ref");
        }
        try {
            return Files.newInputStream(basePath().resolve(ref.substring("local://".length())));
        } catch (IOException e) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Artifact not found: " + ref);
        }
    }

    private Path basePath() {
        Path configured = Path.of(baseDir);
        if (configured.isAbsolute()) {
            return configured;
        }
        return Path.of(System.getProperty("java.io.tmpdir"), baseDir);
    }
}
