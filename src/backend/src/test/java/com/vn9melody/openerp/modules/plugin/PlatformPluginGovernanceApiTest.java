package com.vn9melody.openerp.modules.plugin;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.platform.PlatformTestSupport;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BUG-115 regression lock: the whole {@code PlatformPluginGovernanceResource}
 * (P10-P15, P19-P23) must be registered at runtime. These HTTP-level tests fail
 * with 404 if the resource class is missing from the JAX-RS runtime.
 */
@QuarkusTest
public class PlatformPluginGovernanceApiTest {

    private static final String PLATFORM_PATH = "/api/v1/platform";
    private static final String SA_EMAIL = PlatformTestSupport.PREFIX + "gov-sa@example.com";
    private static final String SUPPORT_EMAIL = PlatformTestSupport.PREFIX + "gov-support@example.com";

    @Inject
    PluginAdminService adminService;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager em;

    @Inject
    RedisDataSource redis;

    @Inject
    ObjectMapper objectMapper;

    private UUID tenantId;
    private UUID superAdminUserId;
    private String superToken;
    private String supportToken;
    private String pluginKey;

    @BeforeEach
    public void setUp() {
        String suffix = S2EngineFixtures.suffix();
        pluginKey = "s2gov-" + suffix;
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(em);
            superAdminUserId = PlatformTestSupport.createPlatformAdmin(SA_EMAIL,
                    PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService).userId;
            PlatformTestSupport.createPlatformAdmin(SUPPORT_EMAIL,
                    PlatformAdminRole.SUPPORT_ENGINEER, PlatformAdminStatus.ACTIVE, passwordHashService);
            tenantId = PlatformTestSupport.createTenant(S2EngineFixtures.PREFIX + "gov-tenant-" + suffix,
                    TenantStatus.ACTIVE).id;
        });
        PlatformTestSupport.clearRedis(redis);
        superToken = login(SA_EMAIL);
        supportToken = login(SUPPORT_EMAIL);
        QuarkusTransaction.requiringNew().run(() -> {
            PluginRequests.RegisterCatalog catalog = new PluginRequests.RegisterCatalog();
            catalog.pluginKey = pluginKey;
            catalog.nameKey = "PLUGIN_" + pluginKey.toUpperCase().replace('-', '_') + "_NAME";
            catalog.descriptionKey = "PLUGIN_" + pluginKey.toUpperCase().replace('-', '_') + "_DESCRIPTION";
            adminService.createCatalog(catalog, superAdminUserId);
        });
    }

    @AfterEach
    public void tearDown() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(em));
        PlatformTestSupport.clearRedis(redis);
    }

    @Test
    @DisplayName("BUG-115 P12/P13: cấp và thu entitlement qua HTTP trả 200 (resource đã đăng ký)")
    public void testEntitlementGrantAndRevoke() {
        given().header("Authorization", "Bearer " + superToken)
                .put(PLATFORM_PATH + "/tenants/" + tenantId + "/plugins/" + pluginKey + "/entitlement")
                .then().statusCode(200)
                .body("success", equalTo(true))
                .body("code", equalTo(PluginErrorCode.PLUGIN_ENTITLEMENT_GRANT_SUCCESS))
                .body("data.plugin_key", equalTo(pluginKey));

        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey).orElse(null);
        assertNotNull(ledger, "P12 phải tạo dòng ledger cho tenant");
        assertEquals(TenantPluginStatus.NOT_INSTALLED, ledger.status);

        given().header("Authorization", "Bearer " + superToken)
                .delete(PLATFORM_PATH + "/tenants/" + tenantId + "/plugins/" + pluginKey + "/entitlement")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_ENTITLEMENT_REVOKE_SUCCESS));
    }

    @Test
    @DisplayName("BUG-115 P10/P11: bulk-apply preview và apply trả 200 (resource đã đăng ký)")
    public void testBulkApplyEndpoints() {
        given().header("Authorization", "Bearer " + superToken).contentType(ContentType.JSON)
                .body("{}")
                .post(PLATFORM_PATH + "/plugins/" + pluginKey + "/bulk-apply/preview")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_BULK_APPLY_PREVIEW_SUCCESS))
                .body("data.tenant_ids", hasItem(tenantId.toString()));

        given().header("Authorization", "Bearer " + superToken).contentType(ContentType.JSON)
                .body(Map.of("tenant_ids", java.util.List.of(tenantId.toString()), "reason", "bug-115 regression"))
                .post(PLATFORM_PATH + "/plugins/" + pluginKey + "/bulk-apply")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_BULK_APPLY_STARTED));
    }

    @Test
    @DisplayName("BUG-115 P14: SUPPORT_ENGINEER đọc được tenant-private, thiếu token trả 401")
    public void testTenantPrivateListAuthorization() {
        given().header("Authorization", "Bearer " + supportToken)
                .get(PLATFORM_PATH + "/tenant-private-plugins")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_TENANT_PRIVATE_LIST_SUCCESS));

        given().get(PLATFORM_PATH + "/tenant-private-plugins")
                .then().statusCode(401)
                .body("code", equalTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("BUG-99: force-uninstall phải khớp số tenant bị ảnh hưởng mới cho khóa catalog")
    public void testForceUninstallAffectedTenantCountMismatch() {
        given().header("Authorization", "Bearer " + superToken).contentType(ContentType.JSON)
                .body(Map.of("reason", "bug-99 mismatch", "force_uninstall", true,
                        "confirmations", Map.of("affected_tenants", 99, "confirm_text", pluginKey)))
                .post(PLATFORM_PATH + "/plugins/" + pluginKey + "/block")
                .then().statusCode(400)
                .body("code", equalTo(PluginErrorCode.PLUGIN_BLOCK_CONFIRMATION_REQUIRED));

        given().header("Authorization", "Bearer " + superToken).contentType(ContentType.JSON)
                .body(Map.of("reason", "bug-99 exact", "force_uninstall", true,
                        "confirmations", Map.of("affected_tenants", 0, "confirm_text", pluginKey)))
                .post(PLATFORM_PATH + "/plugins/" + pluginKey + "/block")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_BLOCK_SUCCESS));
    }

    @Test
    @DisplayName("BUG-115: SUPPORT_ENGINEER bị chặn ghi governance (403, không phải 404)")
    public void testGovernanceWriteForbiddenForSupportEngineer() {
        given().header("Authorization", "Bearer " + supportToken)
                .put(PLATFORM_PATH + "/tenants/" + tenantId + "/plugins/" + pluginKey + "/entitlement")
                .then().statusCode(403);
    }

    @Test
    @DisplayName("BUG-115 P19-P21: platform admin cài/gỡ/bật/tắt hộ tenant qua HTTP")
    public void testPlatformLifecycleOnBehalfOfTenant() {
        registerAndPublish(pluginKey, "1.0.0");

        given().header("Authorization", "Bearer " + superToken).contentType(ContentType.JSON)
                .body(Map.of("version", "1.0.0", "reason", "bug-115 support install"))
                .post(PLATFORM_PATH + "/plugins/" + pluginKey + "/tenants/" + tenantId + "/install")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_INSTALL_STARTED))
                .body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + superToken).contentType(ContentType.JSON)
                .body(Map.of("reason", "bug-115 disable"))
                .post(PLATFORM_PATH + "/plugins/" + pluginKey + "/tenants/" + tenantId + "/disable")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_DISABLE_SUCCESS))
                .body("data.status", equalTo("INACTIVE"));

        given().header("Authorization", "Bearer " + superToken).contentType(ContentType.JSON)
                .body(Map.of("reason", "bug-115 enable"))
                .post(PLATFORM_PATH + "/plugins/" + pluginKey + "/tenants/" + tenantId + "/enable")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_ENABLE_SUCCESS))
                .body("data.status", equalTo("ACTIVE"));

        given().header("Authorization", "Bearer " + superToken).contentType(ContentType.JSON)
                .body(Map.of("reason", "bug-115 uninstall"))
                .post(PLATFORM_PATH + "/plugins/" + pluginKey + "/tenants/" + tenantId + "/uninstall")
                .then().statusCode(200)
                .body("code", equalTo(PluginErrorCode.PLUGIN_UNINSTALL_SUCCESS))
                .body("data.status", equalTo("UNINSTALLED"));
    }

    private void registerAndPublish(String key, String version) {
        QuarkusTransaction.requiringNew().run(() -> {
            PluginRequests.RegisterVersion request = new PluginRequests.RegisterVersion();
            request.source = "DOCKER_HUB";
            request.imageRef = "open-erp/" + key;
            request.tag = version;
            request.version = version;
            request.checksum = "sha256-" + key + "-" + version;
            request.manifest = buildManifest(key, version);
            adminService.registerVersion(key, request, superAdminUserId);
            adminService.publishVersion(key, version, "BUG-115 regression fixture", superAdminUserId);
        });
        QuarkusTransaction.requiringNew().run(() -> {
            PluginCatalog catalog = catalogRepository.findByPluginKey(key);
            TenantPlugin ledger = new TenantPlugin();
            ledger.tenantId = tenantId;
            ledger.catalogId = catalog.id;
            ledger.pluginKey = key;
            ledger.status = TenantPluginStatus.NOT_INSTALLED;
            ledger.createdAt = java.time.Instant.now();
            ledger.updatedAt = ledger.createdAt;
            tenantPluginRepository.persist(ledger);
        });
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

    private String login(String email) {
        return given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", PlatformTestSupport.PASSWORD))
                .when().post("/api/v1/auth/login")
                .then().statusCode(200).extract().path("data.access_token");
    }
}
