package com.vn9melody.openerp.modules.plugin.artifact;

import java.io.InputStream;

/**
 * Plugin artifact storage contract (SOL-02 section 2). A plugin consumer of the
 * shared {@link com.vn9melody.openerp.core.storage.ObjectStorage} primitive: it owns
 * its bucket ({@code plugin-artifacts}) and key layout, while the underlying
 * provider (local disk in dev, MinIO in staging/production) stays generic.
 */
public interface ArtifactStorage {

    record StoredArtifact(String ref, String checksum, long sizeBytes) {}

    StoredArtifact store(String fileName, InputStream content);

    InputStream open(String ref);
}
