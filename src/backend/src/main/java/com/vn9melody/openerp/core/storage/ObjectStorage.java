package com.vn9melody.openerp.core.storage;

import java.io.InputStream;

/**
 * Bucket-aware object storage primitive (Core infrastructure). Consumers own their
 * bucket and key layout — plugin artifacts use {@code plugin-artifacts}, tenant
 * files (avatars, uploads) use {@code tenant-files} with a {@code <tenantId>/…}
 * key prefix for tenant isolation.
 *
 * <p>Runs on local disk in dev and MinIO (primary system storage) in
 * staging/production, selected by {@code openerp.storage.provider}.</p>
 */
public interface ObjectStorage {

    record StoredObject(String bucket, String key, String checksum, long sizeBytes) {}

    StoredObject put(String bucket, String key, InputStream content);

    InputStream get(String bucket, String key);
}
