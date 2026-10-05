package com.vn9melody.openerp.modules.plugin.artifact;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.storage.ObjectStorage;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.InputStream;
import java.util.Locale;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Plugin artifact store on the shared {@link ObjectStorage} primitive. Owns the
 * {@code plugin-artifacts} bucket and the {@code plugins/<uuid>/<name>} key layout;
 * the ref it returns encodes bucket + key so {@link #open(String)} is provider-agnostic.
 */
@ApplicationScoped
public class PluginArtifactStorage implements ArtifactStorage {

    @Inject
    ObjectStorage objectStorage;

    @ConfigProperty(name = "openerp.plugin.artifacts.bucket", defaultValue = "plugin-artifacts")
    String bucket;

    @Override
    public StoredArtifact store(String fileName, InputStream content) {
        String key = "plugins/" + UUID.randomUUID() + "/" + sanitize(fileName);
        ObjectStorage.StoredObject stored = objectStorage.put(bucket, key, content);
        return new StoredArtifact(bucket + "/" + key, stored.checksum(), stored.sizeBytes());
    }

    @Override
    public InputStream open(String ref) {
        if (ref == null || ref.isBlank()) {
            throw new ApiException(400, ErrorCode.STORAGE_INVALID_REF, "Unknown artifact ref");
        }
        int slash = ref.indexOf('/');
        if (slash <= 0 || slash == ref.length() - 1) {
            throw new ApiException(400, ErrorCode.STORAGE_INVALID_REF, "Unknown artifact ref");
        }
        return objectStorage.get(ref.substring(0, slash), ref.substring(slash + 1));
    }

    private String sanitize(String fileName) {
        String base = fileName == null || fileName.isBlank() ? "artifact.zip" : fileName;
        return base.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "_");
    }
}
