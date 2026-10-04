package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.modules.plugin.artifact.PluginImageBuilder;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import org.jboss.logging.Logger;

/**
 * BUG-116: builds the runtime image of a JAR_BUNDLE version OUTSIDE any JTA
 * transaction and caches {@code distribution.image_ref}. Docker/Kaniko builds
 * can take minutes (base image pull, 37MB+ uber-jar) and previously ran inside
 * the install saga transaction, which Narayana rolled back (ARJUNA016102).
 */
@ApplicationScoped
public class PluginBundleImageService {

    private static final Logger LOG = Logger.getLogger(PluginBundleImageService.class);

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    PluginImageBuilder imageBuilder;

    /**
     * Idempotent, non-transactional pre-flight: no-op when the plugin is not a
     * JAR_BUNDLE or the image is already cached in the version distribution.
     */
    public void ensureBundleImage(String pluginKey, String requestedVersion) {
        BuildTarget target = QuarkusTransaction.requiringNew().call(() -> resolveTarget(pluginKey, requestedVersion));
        if (target == null) {
            return;
        }
        LOG.infof("Building bundle image for %s@%s outside transaction", pluginKey, target.version());
        String imageRef = imageBuilder.build(pluginKey, target.version(), target.artifactRef());
        QuarkusTransaction.requiringNew().run(() -> cacheImageRef(pluginKey, target.version(), imageRef));
    }

    private BuildTarget resolveTarget(String pluginKey, String requestedVersion) {
        if (pluginKey == null || pluginKey.isBlank()) {
            return null;
        }
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            return null;
        }
        PluginVersion version;
        if (requestedVersion != null && !requestedVersion.isBlank()) {
            version = versionRepository.findByCatalogAndVersion(catalog.id, requestedVersion).orElse(null);
        } else {
            List<PluginVersion> installable = versionRepository.listInstallable(catalog.id);
            version = installable.isEmpty() ? null : installable.get(0);
        }
        if (version == null || version.distribution == null) {
            return null;
        }
        if (!"JAR_BUNDLE".equals(version.distribution.path("type").asText(""))) {
            return null;
        }
        if (!version.distribution.path("image_ref").asText("").isBlank()) {
            return null;
        }
        String artifactRef = version.distribution.path("artifact_ref").asText("");
        if (artifactRef.isBlank()) {
            return null;
        }
        return new BuildTarget(version.version, artifactRef);
    }

    private void cacheImageRef(String pluginKey, String version, String imageRef) {
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            return;
        }
        versionRepository.findByCatalogAndVersion(catalog.id, version).ifPresent(entity -> {
            if (entity.distribution instanceof ObjectNode node) {
                node.put("image_ref", imageRef);
                node.put("image_builder", "platform");
            }
        });
    }

    private record BuildTarget(String version, String artifactRef) {
    }
}
