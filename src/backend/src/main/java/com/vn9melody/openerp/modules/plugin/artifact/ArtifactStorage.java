package com.vn9melody.openerp.modules.plugin.artifact;

import java.io.InputStream;

/**
 * Artifact storage abstraction (SOL-02 section 2). The local filesystem
 * implementation serves development; the MinIO implementation (primary system
 * storage, TASK-335) plugs into the same contract.
 */
public interface ArtifactStorage {

    record StoredArtifact(String ref, String checksum, long sizeBytes) {}

    StoredArtifact store(String fileName, InputStream content);

    InputStream open(String ref);
}
