package com.vn9melody.openerp.core.storage;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
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
import org.eclipse.microprofile.config.inject.ConfigProperty;

/** Local-filesystem {@link ObjectStorage} for development. */
@ApplicationScoped
@IfBuildProperty(name = "openerp.storage.provider", stringValue = "local", enableIfMissing = true)
public class LocalObjectStorage implements ObjectStorage {

    @ConfigProperty(name = "openerp.storage.local.dir", defaultValue = "openerp-object-storage")
    String baseDir;

    @Override
    public StoredObject put(String bucket, String key, InputStream content) {
        Path target = resolve(bucket, key);
        try {
            Files.createDirectories(target.getParent());
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (DigestInputStream digestStream = new DigestInputStream(content, digest)) {
                Files.copy(digestStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredObject(bucket, key, HexFormat.of().formatHex(digest.digest()), Files.size(target));
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new ApiException(500, ErrorCode.STORAGE_WRITE_FAILED, "Cannot store object: " + e.getMessage());
        }
    }

    @Override
    public InputStream get(String bucket, String key) {
        Path target = resolve(bucket, key);
        if (!Files.isRegularFile(target)) {
            throw new ApiException(404, ErrorCode.STORAGE_OBJECT_NOT_FOUND, "Object not found");
        }
        try {
            return Files.newInputStream(target);
        } catch (IOException e) {
            throw new ApiException(500, ErrorCode.STORAGE_OBJECT_NOT_FOUND, "Cannot read object: " + e.getMessage());
        }
    }

    private Path resolve(String bucket, String key) {
        if (isUnsafe(bucket) || isUnsafe(key)) {
            throw new ApiException(400, ErrorCode.STORAGE_INVALID_REF, "Invalid bucket or key");
        }
        Path base = Path.of(baseDir);
        if (!base.isAbsolute()) {
            base = Path.of(System.getProperty("java.io.tmpdir"), baseDir);
        }
        return base.resolve(bucket).resolve(key).normalize();
    }

    private boolean isUnsafe(String value) {
        return value == null || value.isBlank() || value.contains("..") || value.startsWith("/") || value.contains("\\");
    }
}
