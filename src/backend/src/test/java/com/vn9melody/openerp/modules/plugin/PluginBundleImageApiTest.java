package com.vn9melody.openerp.modules.plugin;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.plugin.artifact.PluginImageBuilder;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import com.vn9melody.openerp.modules.plugin.service.PluginArtifactUploadService;
import com.vn9melody.openerp.modules.plugin.service.PluginBundleImageService;
import com.vn9melody.openerp.modules.plugin.service.PluginEntitlementService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BUG-116 regression lock: the JAR_BUNDLE image must be built outside the JTA
 * transaction (pre-flight via {@link PluginBundleImageService}) and cached in
 * {@code distribution.image_ref} so the install saga never runs docker build
 * inside its transaction.
 */
@QuarkusTest
public class PluginBundleImageApiTest {

    private static final String TENANT_PLUGINS_PATH = "/api/v1/tenant/plugins";

    @Inject
    PluginAdminService adminService;

    @Inject
    PluginArtifactUploadService uploadService;

    @Inject
    PluginEntitlementService entitlementService;

    @Inject
    PluginBundleImageService bundleImageService;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    SecurityContextService securityContextService;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    EntityManager em;

    private UUID tenantId;
    private UUID userId;
    private String token;
    private String pluginKey;

    @BeforeEach
    @Transactional
    public void setUp() {
        String suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        userId = S2EngineFixtures.insertUser(em, "bundle-" + suffix);
        insertPluginPermissions();
        UUID roleId = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-bundle");
        for (String permission : List.of("core:plugin:read", "core:plugin:install", "core:plugin:manage",
                "core:plugin:register-custom")) {
            S2EngineFixtures.grantPermission(em, roleId, permission);
        }
        S2EngineFixtures.assignRole(em, userId, tenantId, roleId);
        securityContextService.invalidate(tenantId, userId);
        token = jwtTokenService.generateAccessToken(
                userId, S2EngineFixtures.PREFIX + "bundle-" + suffix + "@example.com", tenantId, "TENANT_ADMIN",
                UUID.randomUUID().toString());
        pluginKey = "s2bundle-" + suffix;
    }

    @Test
    @DisplayName("BUG-116: ensureBundleImage build ngoài transaction và cache image_ref vào distribution")
    public void testEnsureBundleImageBuildsOutsideTransactionAndCaches() {
        registerBundleAndPublish(pluginKey, "1.0.0");
        assertTrue(distributionImageRef(pluginKey, "1.0.0").isBlank(), "chưa build thì chưa có image_ref");

        AtomicInteger builds = new AtomicInteger();
        AtomicBoolean activeTxDuringBuild = new AtomicBoolean(true);
        QuarkusMock.installMockForType(new PluginImageBuilder() {
            @Override
            public String build(String key, String version, String artifactRef) {
                builds.incrementAndGet();
                activeTxDuringBuild.set(QuarkusTransaction.isActive());
                return "mock-registry.local/" + key + ":" + version;
            }
        }, PluginImageBuilder.class);

        bundleImageService.ensureBundleImage(pluginKey, "1.0.0");

        assertEquals(1, builds.get());
        assertFalse(activeTxDuringBuild.get(), "image build phải chạy ngoài JTA transaction");
        assertEquals("mock-registry.local/" + pluginKey + ":1.0.0", distributionImageRef(pluginKey, "1.0.0"));

        bundleImageService.ensureBundleImage(pluginKey, "1.0.0");
        assertEquals(1, builds.get(), "lần ensure thứ hai phải dùng cache, không build lại");
    }

    @Test
    @DisplayName("BUG-116: install bundle sau pre-flight dùng cache, không build trong saga transaction")
    public void testInstallUsesCachedImageWithoutRebuild() {
        registerBundleAndPublish(pluginKey, "1.0.0");

        AtomicInteger builds = new AtomicInteger();
        AtomicBoolean activeTxDuringBuild = new AtomicBoolean(true);
        QuarkusMock.installMockForType(new PluginImageBuilder() {
            @Override
            public String build(String key, String version, String artifactRef) {
                builds.incrementAndGet();
                activeTxDuringBuild.set(QuarkusTransaction.isActive());
                return "mock-registry.local/" + key + ":" + version;
            }
        }, PluginImageBuilder.class);

        bundleImageService.ensureBundleImage(pluginKey, "1.0.0");
        assertEquals(1, builds.get());
        assertFalse(activeTxDuringBuild.get());

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200)
                .body("data.status", equalTo("ACTIVE"));

        assertEquals(1, builds.get(), "install saga không được build lại image");
        assertEquals("mock-registry.local/" + pluginKey + ":1.0.0", distributionImageRef(pluginKey, "1.0.0"));
    }

    @Test
    @DisplayName("BUG-116: install không pre-flight vẫn hoạt động — fallback suspend transaction khi build")
    public void testInstallFallbackSuspendsTransaction() {
        registerBundleAndPublish(pluginKey, "1.0.0");

        AtomicInteger builds = new AtomicInteger();
        AtomicBoolean activeTxDuringBuild = new AtomicBoolean(true);
        QuarkusMock.installMockForType(new PluginImageBuilder() {
            @Override
            public String build(String key, String version, String artifactRef) {
                builds.incrementAndGet();
                activeTxDuringBuild.set(QuarkusTransaction.isActive());
                return "mock-registry.local/" + key + ":" + version;
            }
        }, PluginImageBuilder.class);

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200)
                .body("data.status", equalTo("ACTIVE"));

        assertEquals(1, builds.get());
        assertFalse(activeTxDuringBuild.get(), "fallback build phải suspend transaction của saga");
    }

    private String distributionImageRef(String key, String version) {
        return QuarkusTransaction.requiringNew().call(() -> {
            PluginCatalog catalog = catalogRepository.findByPluginKey(key);
            PluginVersion entity = versionRepository.findByCatalogAndVersion(catalog.id, version).orElseThrow();
            return entity.distribution.path("image_ref").asText("");
        });
    }

    private void registerBundleAndPublish(String key, String version) {
        QuarkusTransaction.requiringNew().run(() -> {
            PluginRequests.RegisterCatalog catalog = new PluginRequests.RegisterCatalog();
            catalog.pluginKey = key;
            catalog.nameKey = "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_NAME";
            catalog.descriptionKey = "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_DESCRIPTION";
            adminService.createCatalog(catalog, userId);
        });
        var bundle = uploadService.upload(key + "-bundle.zip",
                new ByteArrayInputStream(("bundle-" + key + "-" + version).getBytes(StandardCharsets.UTF_8)),
                tenantId);
        QuarkusTransaction.requiringNew().run(() -> {
            PluginRequests.RegisterVersion request = new PluginRequests.RegisterVersion();
            request.source = "JAR_BUNDLE";
            request.artifactRef = bundle.artifactRef;
            request.checksum = bundle.checksum;
            request.version = version;
            request.manifest = buildManifest(key, version);
            adminService.registerVersion(key, request, userId);
            adminService.publishVersion(key, version, "BUG-116 fixture", userId);
        });
        QuarkusTransaction.requiringNew().run(() -> entitlementService.grant(tenantId, key));
    }

    private ObjectNode buildManifest(String key, String version) {
        ObjectNode manifest = objectMapper.createObjectNode();
        manifest.put("id", key);
        manifest.put("version", version);
        manifest.put("core_version_compatibility", ">=1.0.0 <2.0.0");
        manifest.put("migration_policy", "COMPATIBLE");
        ArrayNode permissions = manifest.putArray("permissions");
        permissions.add("core:plugin:read");
        return manifest;
    }

    private void insertPluginPermissions() {
        for (String code : List.of("core:plugin:read", "core:plugin:install", "core:plugin:manage",
                "core:plugin:register-custom")) {
            em.createNativeQuery("""
                    INSERT INTO permissions (code, domain, resource, action, description_key, is_system)
                    VALUES (?1, 'core', 'plugin', ?2, ?3, FALSE)
                    ON CONFLICT (code) DO UPDATE SET is_system = FALSE
                    """)
                    .setParameter(1, code)
                    .setParameter(2, code.substring(code.lastIndexOf(':') + 1))
                    .setParameter(3, "PERM_" + code.toUpperCase().replace(':', '_'))
                    .executeUpdate();
        }
    }
}
