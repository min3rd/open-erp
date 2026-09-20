package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.artifact.ArtifactStorage;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.InputStream;
import java.util.UUID;

/**
 * Artifact upload for platform (P4) and tenant-private plugins (T14)
 * (TASK-332). Tenant uploads get an ownership prefix validated at registration.
 */
@ApplicationScoped
public class PluginArtifactUploadService {

    @Inject
    ArtifactStorage artifactStorage;

    public PluginResponses.UploadResult upload(String fileName, InputStream content, UUID ownerTenantId) {
        String storedName = fileName;
        if (ownerTenantId != null) {
            storedName = "t" + shortId(ownerTenantId) + "-" + fileName;
        }
        ArtifactStorage.StoredArtifact stored = artifactStorage.store(storedName, content);
        PluginResponses.UploadResult result = new PluginResponses.UploadResult();
        result.artifactRef = stored.ref();
        result.checksum = stored.checksum();
        result.sizeBytes = stored.sizeBytes();
        result.fileName = storedName;
        return result;
    }

    public void assertOwnedBy(String artifactRef, UUID tenantId) {
        if (artifactRef == null || tenantId == null) {
            return;
        }
        String expected = "t" + shortId(tenantId) + "-";
        if (!artifactRef.contains(expected)) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_ARTIFACT_NOT_OWNED,
                    "Artifact belongs to another tenant");
        }
    }

    private String shortId(UUID tenantId) {
        return tenantId.toString().replace("-", "").substring(0, 8);
    }
}
