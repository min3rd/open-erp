package com.vn9melody.openerp.modules.plugin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import com.vn9melody.openerp.modules.plugin.service.PluginArtifactUploadService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-333/TASK-344: artifact verification - registry allowlist and private
 * host guards plus bundle checksum verification, on real PostgreSQL.
 */
@QuarkusTest
public class PluginArtifactVerifierTest {

    @Inject
    PluginAdminService adminService;

    @Inject
    PluginArtifactUploadService uploadService;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    EntityManager em;

    private UUID tenantId;
    private UUID userId;
    private String pluginKey;

    @BeforeEach
    public void setUp() {
        String suffix = S2EngineFixtures.suffix();
        QuarkusTransaction.requiringNew().run(() -> {
            tenantId = S2EngineFixtures.insertTenant(em, suffix);
            userId = S2EngineFixtures.insertUser(em, "art-" + suffix);
            pluginKey = "art-" + suffix;
            PluginRequests.RegisterCatalog catalog = new PluginRequests.RegisterCatalog();
            catalog.pluginKey = pluginKey;
            catalog.nameKey = "PLUGIN_ART_NAME";
            catalog.descriptionKey = "PLUGIN_ART_DESCRIPTION";
            adminService.createCatalog(catalog, userId);
        });
    }

    @Test
    @DisplayName("TASK-333: registry ngoài allowlist bị từ chối PLUGIN_REGISTRY_NOT_ALLOWED")
    public void testRegistryAllowlistRejectsUnknownHost() {
        ApiException error = assertThrows(ApiException.class, () -> QuarkusTransaction.requiringNew().run(() ->
                adminService.registerVersion(pluginKey, versionRequest("IMAGE_REGISTRY", "0.1.0",
                        ref -> ref.registryUrl = "https://evil.example.com"), userId)));
        assertEquals(PluginErrorCode.PLUGIN_REGISTRY_NOT_ALLOWED, error.getErrorCode());
    }

    @Test
    @DisplayName("TASK-333: host private/loopback bị từ chối kể cả allowlist rỗng")
    public void testPrivateHostRejected() {
        ApiException error = assertThrows(ApiException.class, () -> QuarkusTransaction.requiringNew().run(() ->
                adminService.registerVersion(pluginKey, versionRequest("IMAGE_REGISTRY", "0.1.1",
                        ref -> ref.registryUrl = "http://127.0.0.1:5000"), userId)));
        assertEquals(PluginErrorCode.PLUGIN_REGISTRY_NOT_ALLOWED, error.getErrorCode());
    }

    @Test
    @DisplayName("TASK-333: checksum bundle sai bị từ chối, đúng thì đăng ký thành công")
    public void testBundleChecksumVerification() {
        PluginResponses.UploadResult upload = uploadService.upload("bundle.zip",
                new ByteArrayInputStream("bundle-content".getBytes(StandardCharsets.UTF_8)), tenantId);
        assertNotNull(upload.checksum);

        ApiException mismatch = assertThrows(ApiException.class, () -> QuarkusTransaction.requiringNew().run(() ->
                adminService.registerVersion(pluginKey, versionRequest("JAR_BUNDLE", "0.2.0",
                        ref -> {
                            ref.artifactRef = upload.artifactRef;
                            ref.checksum = "deadbeef";
                        }), userId)));
        assertEquals(PluginErrorCode.PLUGIN_ARTIFACT_CHECKSUM_MISMATCH, mismatch.getErrorCode());

        QuarkusTransaction.requiringNew().run(() -> {
            PluginResponses.VersionItem item = adminService.registerVersion(pluginKey,
                    versionRequest("JAR_BUNDLE", "0.2.0", ref -> {
                        ref.artifactRef = upload.artifactRef;
                        ref.checksum = upload.checksum;
                    }), userId);
            assertEquals("0.2.0", item.version);
        });
    }

    private PluginRequests.RegisterVersion versionRequest(String source, String version,
                                                          java.util.function.Consumer<PluginRequests.RegisterVersion> customizer) {
        PluginRequests.RegisterVersion request = new PluginRequests.RegisterVersion();
        request.source = source;
        request.version = version;
        request.manifest = manifest(version);
        customizer.accept(request);
        return request;
    }

    private ObjectNode manifest(String version) {
        ObjectNode manifest = objectMapper.createObjectNode();
        manifest.put("plugin_key", pluginKey);
        manifest.put("version", version);
        manifest.put("core_version_compatibility", ">=1.0.0 <2.0.0");
        manifest.put("migration_policy", "COMPATIBLE");
        ArrayNode permissions = manifest.putArray("permissions");
        permissions.add("art:item:read");
        return manifest;
    }
}
