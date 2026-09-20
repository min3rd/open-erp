package com.vn9melody.openerp.modules.plugin;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import com.vn9melody.openerp.modules.plugin.service.PluginArtifactUploadService;
import com.vn9melody.openerp.modules.plugin.service.PluginEntitlementService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.narayana.jta.QuarkusTransaction;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-314: plugin lifecycle end-to-end on real PostgreSQL + Redis with the
 * no-op runtime deployer (%test). Covers install/enable/disable/uninstall,
 * upgrade, breaking-upgrade snapshot guard, emergency block and UI manifest.
 */
@QuarkusTest
public class PluginLifecycleApiTest {

    private static final String TENANT_PLUGINS_PATH = "/api/v1/tenant/plugins";
    private static final String UI_MANIFEST_PATH = "/api/v1/plugins/ui-manifest";

    @Inject
    PluginAdminService adminService;

    @Inject
    PluginEntitlementService entitlementService;

    @Inject
    PluginArtifactUploadService uploadService;

    @Inject
    TenantPluginRepository tenantPluginRepository;

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
        userId = S2EngineFixtures.insertUser(em, "plg-" + suffix);
        insertPluginPermissions();
        UUID roleId = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-plg");
        for (String permission : List.of("core:plugin:read", "core:plugin:install", "core:plugin:manage",
                "core:plugin:register-custom")) {
            S2EngineFixtures.grantPermission(em, roleId, permission);
        }
        S2EngineFixtures.assignRole(em, userId, tenantId, roleId);
        securityContextService.invalidate(tenantId, userId);
        token = jwtTokenService.generateAccessToken(
                userId, S2EngineFixtures.PREFIX + "plg-" + suffix + "@example.com", tenantId, "TENANT_ADMIN",
                UUID.randomUUID().toString());
        pluginKey = "s3lt-" + suffix;
    }

    @Test
    @DisplayName("TASK-314: install → enable/disable → uninstall giữ dữ liệu (schema còn tồn tại)")
    public void testInstallDisableUninstallKeepsData() {
        registerAndPublish(pluginKey, "1.0.0", "COMPATIBLE", true);

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200).body("code", equalTo("PLUGIN_INSTALL_SUCCESS"))
                .body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + token)
                .get(TENANT_PLUGINS_PATH)
                .then().statusCode(200)
                .body("data.items", hasSize(1))
                .body("data.items[0].status", equalTo("ACTIVE"))
                .body("data.items[0].installed_version", equalTo("1.0.0"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/disable")
                .then().statusCode(200).body("data.status", equalTo("INACTIVE"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/enable")
                .then().statusCode(200).body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/uninstall")
                .then().statusCode(200).body("data.status", equalTo("UNINSTALLED"));

        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).orElseThrow();
        assertEquals(TenantPluginStatus.UNINSTALLED, ledger.status);
        assertTrue(schemaExists(expectedSchema(pluginKey)), "tenant schema must be retained after uninstall");
    }

    @Test
    @DisplayName("TASK-314: upgrade COMPATIBLE lên bản mới giữ ACTIVE")
    public void testUpgradeCompatibleVersion() {
        registerAndPublish(pluginKey, "1.0.0", "COMPATIBLE", false);
        registerAndPublish(pluginKey, "1.1.0", "COMPATIBLE", false);

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200).body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("target_version", "1.1.0", "snapshot", false))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/upgrade")
                .then().statusCode(200)
                .body("data.status", equalTo("ACTIVE"))
                .body("data.target_version", equalTo("1.1.0"));

        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).orElseThrow();
        assertEquals("1.1.0", ledger.installedVersion);
    }

    @Test
    @DisplayName("TASK-314: upgrade BREAKING từ chối snapshot=false (PLUGIN_SNAPSHOT_REQUIRED)")
    public void testBreakingUpgradeRequiresSnapshot() {
        registerAndPublish(pluginKey, "1.0.0", "COMPATIBLE", false);
        registerAndPublish(pluginKey, "2.0.0", "BREAKING", false);

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200).body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("target_version", "2.0.0", "snapshot", false))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/upgrade")
                .then().statusCode(409)
                .body("code", equalTo("PLUGIN_SNAPSHOT_REQUIRED"));

        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).orElseThrow();
        assertEquals("1.0.0", ledger.installedVersion);
        assertEquals(TenantPluginStatus.ACTIVE, ledger.status);
    }

    @Test
    @DisplayName("TASK-314: khóa catalog cưỡng chế gỡ toàn bộ tenant + gửi thông báo")
    public void testEmergencyBlockForcesUninstallAndNotifies() {
        registerAndPublish(pluginKey, "1.0.0", "COMPATIBLE", false);
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200).body("data.status", equalTo("ACTIVE"));

        PluginRequests.Block block = new PluginRequests.Block();
        block.reason = "S3-TASK-314 security drill";
        block.forceUninstall = true;
        block.confirmations = new PluginRequests.Block.Confirmations();
        block.confirmations.confirmText = pluginKey;
        QuarkusTransaction.requiringNew().run(() -> adminService.blockCatalog(pluginKey, block, userId));

        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).orElseThrow();
        assertEquals(TenantPluginStatus.UNINSTALLED, ledger.status);
        long notifications = countNotifications();
        assertTrue(notifications > 0, "affected tenant must receive a notification");
    }

    @Test
    @DisplayName("TASK-314: UI manifest trả screens/contributions theo quyền và slot hợp lệ")
    public void testUiManifest() {
        registerAndPublish(pluginKey, "1.0.0", "COMPATIBLE", true);
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200).body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + token)
                .get(UI_MANIFEST_PATH)
                .then().statusCode(200)
                .body("code", equalTo("PLUGIN_UI_MANIFEST_SUCCESS"))
                .body("data.screens", hasSize(1))
                .body("data.screens[0].plugin_key", equalTo(pluginKey))
                .body("data.slots", hasSize(1))
                .body("data.slots[0].slot_code", equalTo("core.dashboard.widgets"))
                .body("data.slots[0].contributions", hasSize(1))
                .body("data.slots[0].host.type", equalTo("CORE"));
    }

    @Test
    @DisplayName("TASK-340: gateway chặn khi chưa cài (403) và báo runtime unavailable với noop (503)")
    public void testRuntimeGatewayGuards() {
        registerAndPublish(pluginKey, "1.0.0", "COMPATIBLE", false);

        given().header("Authorization", "Bearer " + token)
                .get("/api/v1/plugins/runtime/" + pluginKey + "/health")
                .then().statusCode(403)
                .body("code", equalTo("PLUGIN_DISABLED_FOR_TENANT"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("plugin_key", pluginKey))
                .post("/api/v1/plugins/session-token")
                .then().statusCode(403)
                .body("code", equalTo("PLUGIN_DISABLED_FOR_TENANT"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200).body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + token)
                .get("/api/v1/plugins/runtime/" + pluginKey + "/health")
                .then().statusCode(503)
                .body("code", equalTo("PLUGIN_RUNTIME_UNAVAILABLE"));

        String sessionToken = given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("plugin_key", pluginKey))
                .post("/api/v1/plugins/session-token")
                .then().statusCode(200)
                .body("code", equalTo("PLUGIN_RUNTIME_SESSION_ISSUED"))
                .body("data.entry", equalTo("/api/v1/plugins/runtime/" + pluginKey))
                .body("data.expires_in_seconds", equalTo(300))
                .extract().path("data.token");
        assertTrue(sessionToken != null && !sessionToken.isBlank(), "session token must be issued");

        given().queryParam("plugin_token", sessionToken)
                .get("/api/v1/plugins/runtime/" + pluginKey + "/health")
                .then().statusCode(503)
                .body("code", equalTo("PLUGIN_RUNTIME_UNAVAILABLE"));

        given().queryParam("plugin_token", sessionToken + "tampered")
                .get("/api/v1/plugins/runtime/" + pluginKey + "/health")
                .then().statusCode(401)
                .body("code", equalTo("PLUGIN_RUNTIME_TOKEN_INVALID"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/disable")
                .then().statusCode(200).body("data.status", equalTo("INACTIVE"));

        given().header("Authorization", "Bearer " + token)
                .post("/api/v1/plugins/runtime/" + pluginKey + "/anything")
                .then().statusCode(403)
                .body("code", equalTo("PLUGIN_DISABLED_FOR_TENANT"));
    }

    @Test
    @DisplayName("TASK-334: JAR_BUNDLE install builds image qua ImageBuilder và cache image_ref")
    public void testJarBundleInstallBuildsImage() {
        registerBundleAndPublish(pluginKey, "1.0.0");

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0"))
                .post(TENANT_PLUGINS_PATH + "/" + pluginKey + "/install")
                .then().statusCode(200).body("data.status", equalTo("ACTIVE"));

        QuarkusTransaction.requiringNew().run(() -> {
            UUID catalogId = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).orElseThrow().catalogId;
            var version = em.createQuery(
                            "select v from PluginVersion v where v.catalogId = ?1 and v.version = ?2",
                            com.vn9melody.openerp.modules.plugin.model.PluginVersion.class)
                    .setParameter(1, catalogId)
                    .setParameter(2, "1.0.0")
                    .getSingleResult();
            assertEquals("openerp-registry.local/" + pluginKey + ":1.0.0",
                    version.distribution.path("image_ref").asText());
            assertEquals("platform", version.distribution.path("image_builder").asText());
        });
    }

    @Test
    @DisplayName("T2: tenant detail trả catalog cho plugin được cấp phép, 404 với key lạ")
    public void testTenantDetail() {
        registerAndPublish(pluginKey, "1.0.0", "COMPATIBLE", false);

        given().header("Authorization", "Bearer " + token)
                .get(TENANT_PLUGINS_PATH + "/" + pluginKey)
                .then().statusCode(200)
                .body("code", equalTo("PLUGIN_DETAIL_SUCCESS"))
                .body("data.plugin_key", equalTo(pluginKey))
                .body("data.version", hasSize(1))
                .body("data.version[0].version", equalTo("1.0.0"));

        given().header("Authorization", "Bearer " + token)
                .get(TENANT_PLUGINS_PATH + "/s3lt-missing-" + UUID.randomUUID().toString().substring(0, 8))
                .then().statusCode(404)
                .body("code", equalTo("PLUGIN_NOT_FOUND"));
    }

    @Test
    @DisplayName("T8/T15-T18: tenant tự đăng ký plugin riêng, publish, cài, gỡ version/catalog")
    public void testTenantCustomPluginFlow() {
        QuarkusTransaction.requiringNew().run(() -> em
                .createNativeQuery("UPDATE tenants SET allow_custom_plugins = TRUE WHERE id = ?1")
                .setParameter(1, tenantId)
                .executeUpdate());

        String customKey = "priv-" + tenantId.toString().substring(0, 8);
        ObjectNode manifest = buildManifest(customKey, "0.1.0", "COMPATIBLE", false);
        Map<String, Object> register = Map.of(
                "plugin_key", customKey,
                "name_key", "PLUGIN_" + customKey.toUpperCase().replace('-', '_') + "_NAME",
                "description_key", "PLUGIN_" + customKey.toUpperCase().replace('-', '_') + "_DESCRIPTION",
                "source", "DOCKER_HUB",
                "version", "0.1.0",
                "image_ref", "open-erp/" + customKey,
                "tag", "0.1.0",
                "checksum", "sha256-" + customKey,
                "manifest", manifest);

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(register)
                .post(TENANT_PLUGINS_PATH + "/register")
                .then().statusCode(201)
                .body("code", equalTo("PLUGIN_REGISTER_SUCCESS"))
                .body("data.release_status", equalTo("DRAFT"));

        given().header("Authorization", "Bearer " + token)
                .get(TENANT_PLUGINS_PATH + "/" + customKey + "/versions")
                .then().statusCode(200)
                .body("data.items", hasSize(1))
                .body("data.items[0].release_status", equalTo("DRAFT"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("action", "BLOCK", "reason", "tenant must not block"))
                .patch(TENANT_PLUGINS_PATH + "/" + customKey + "/versions/0.1.0")
                .then().statusCode(400);

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("action", "PUBLISH", "reason", "tenant publish"))
                .patch(TENANT_PLUGINS_PATH + "/" + customKey + "/versions/0.1.0")
                .then().statusCode(200)
                .body("data.release_status", equalTo("PUBLISHED"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("version", "0.1.0"))
                .post(TENANT_PLUGINS_PATH + "/" + customKey + "/install")
                .then().statusCode(200).body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + token)
                .delete(TENANT_PLUGINS_PATH + "/" + customKey + "/versions/0.1.0")
                .then().statusCode(409)
                .body("code", equalTo("PLUGIN_VERSION_IN_USE"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .post(TENANT_PLUGINS_PATH + "/" + customKey + "/uninstall")
                .then().statusCode(200).body("data.status", equalTo("UNINSTALLED"));

        given().header("Authorization", "Bearer " + token)
                .delete(TENANT_PLUGINS_PATH + "/" + customKey + "/versions/0.1.0")
                .then().statusCode(200);

        given().header("Authorization", "Bearer " + token)
                .delete(TENANT_PLUGINS_PATH + "/" + customKey + "/catalog")
                .then().statusCode(200)
                .body("code", equalTo("PLUGIN_CATALOG_DELETE_SUCCESS"));
    }

    private void registerAndPublish(String key, String version, String migrationPolicy, boolean withUi) {
        QuarkusTransaction.requiringNew().run(() -> {
            if (!adminService.existsByKey(key)) {
                PluginRequests.RegisterCatalog catalog = new PluginRequests.RegisterCatalog();
                catalog.pluginKey = key;
                catalog.nameKey = "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_NAME";
                catalog.descriptionKey = "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_DESCRIPTION";
                adminService.createCatalog(catalog, userId);
            }
        });
        QuarkusTransaction.requiringNew().run(() -> {
            PluginRequests.RegisterVersion request = new PluginRequests.RegisterVersion();
            request.source = "DOCKER_HUB";
            request.imageRef = "open-erp/" + key;
            request.tag = version;
            request.version = version;
            request.checksum = "sha256-" + key + "-" + version;
            request.manifest = buildManifest(key, version, migrationPolicy, withUi);
            adminService.registerVersion(key, request, userId);
            adminService.publishVersion(key, version, "TASK-314 fixture", userId);
        });
        QuarkusTransaction.requiringNew().run(() -> entitlementService.grant(tenantId, key));
    }

    private void registerBundleAndPublish(String key, String version) {
        QuarkusTransaction.requiringNew().run(() -> {
            if (!adminService.existsByKey(key)) {
                PluginRequests.RegisterCatalog catalog = new PluginRequests.RegisterCatalog();
                catalog.pluginKey = key;
                catalog.nameKey = "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_NAME";
                catalog.descriptionKey = "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_DESCRIPTION";
                adminService.createCatalog(catalog, userId);
            }
        });
        PluginResponses.UploadResult bundle = uploadService.upload(key + "-bundle.zip",
                new ByteArrayInputStream(("bundle-" + key + "-" + version).getBytes(StandardCharsets.UTF_8)),
                tenantId);
        QuarkusTransaction.requiringNew().run(() -> {
            PluginRequests.RegisterVersion request = new PluginRequests.RegisterVersion();
            request.source = "JAR_BUNDLE";
            request.artifactRef = bundle.artifactRef;
            request.checksum = bundle.checksum;
            request.version = version;
            request.manifest = buildManifest(key, version, "COMPATIBLE", false);
            adminService.registerVersion(key, request, userId);
            adminService.publishVersion(key, version, "TASK-334 fixture", userId);
        });
        QuarkusTransaction.requiringNew().run(() -> entitlementService.grant(tenantId, key));
    }

    private ObjectNode buildManifest(String key, String version, String migrationPolicy, boolean withUi) {
        ObjectNode manifest = objectMapper.createObjectNode();
        manifest.put("id", key);
        manifest.put("version", version);
        manifest.put("core_version_compatibility", ">=1.0.0 <2.0.0");
        manifest.put("migration_policy", migrationPolicy);
        ArrayNode permissions = manifest.putArray("permissions");
        permissions.add("s3temp:item:read");
        if (withUi) {
            ObjectNode ui = manifest.putObject("ui_manifest");
            ArrayNode screens = ui.putArray("screens");
            ObjectNode screen = screens.addObject();
            screen.put("route", "/apps/" + key);
            screen.put("title_key", "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_MENU");
            screen.put("permission", "core:plugin:read");
            screen.put("render_mode", "MODULE_FEDERATION");
            ArrayNode contributions = ui.putArray("contributions");
            ObjectNode contribution = contributions.addObject();
            contribution.put("slot", "core.dashboard.widgets");
            contribution.put("title_key", "PLUGIN_" + key.toUpperCase().replace('-', '_') + "_WIDGET");
            contribution.put("render_mode", "WEB_COMPONENT");
            contribution.put("entry", "/plugins-runtime/" + key + "/widget.js");
            contribution.put("permission", "core:plugin:read");
        }
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

    private boolean schemaExists(String schema) {
        Number count = (Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?1")
                .setParameter(1, schema)
                .getSingleResult();
        return count != null && count.longValue() > 0;
    }

    private String expectedSchema(String key) {
        String tenantShort = tenantId.toString().replace("-", "").substring(0, 8);
        return "tenant_" + tenantShort + "_" + key.toLowerCase().replaceAll("[^a-z0-9]", "_");
    }

    private long countNotifications() {
        Number count = (Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM tenant_notifications WHERE tenant_id = ?1")
                .setParameter(1, tenantId)
                .getSingleResult();
        return count == null ? 0 : count.longValue();
    }
}
