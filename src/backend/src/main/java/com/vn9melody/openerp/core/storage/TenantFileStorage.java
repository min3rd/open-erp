package com.vn9melody.openerp.core.storage;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.InputStream;
import java.util.Locale;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Tenant-scoped file storage on the shared {@link ObjectStorage} primitive. Owns
 * the {@code tenant-files} bucket and a {@code <tenantId>/<category>/<uuid>/<name>}
 * key layout, so every tenant's files are isolated by prefix in one bucket.
 */
@ApplicationScoped
public class TenantFileStorage {

    @Inject
    ObjectStorage objectStorage;

    @ConfigProperty(name = "openerp.storage.tenant-files.bucket", defaultValue = "tenant-files")
    String bucket;

    public record StoredTenantFile(String ref, String checksum, long sizeBytes) {}

    public StoredTenantFile store(UUID tenantId, String category, String fileName, InputStream content) {
        if (tenantId == null) {
            throw new ApiException(400, ErrorCode.STORAGE_INVALID_REF, "tenantId is required");
        }
        String key = tenantId + "/" + sanitizeCategory(category) + "/" + UUID.randomUUID() + "/" + sanitize(fileName);
        ObjectStorage.StoredObject stored = objectStorage.put(bucket, key, content);
        return new StoredTenantFile(bucket + "/" + key, stored.checksum(), stored.sizeBytes());
    }

    public InputStream open(String ref) {
        if (ref == null || ref.isBlank()) {
            throw new ApiException(400, ErrorCode.STORAGE_INVALID_REF, "Unknown file ref");
        }
        int slash = ref.indexOf('/');
        if (slash <= 0 || slash == ref.length() - 1) {
            throw new ApiException(400, ErrorCode.STORAGE_INVALID_REF, "Unknown file ref");
        }
        return objectStorage.get(ref.substring(0, slash), ref.substring(slash + 1));
    }

    private String sanitizeCategory(String category) {
        return category == null || category.isBlank() ? "files"
                : category.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "_");
    }

    private String sanitize(String fileName) {
        String base = fileName == null || fileName.isBlank() ? "file.bin" : fileName;
        return base.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "_");
    }
}
