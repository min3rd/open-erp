package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * FEAT-20: ops-declared plugins in {@code openerp.platform.plugin-catalog} are merged
 * into the API catalog (deduped, core stays mandatory); the default profile without
 * the property only shows {@code core} (see {@link PlatformPluginApiTest}).
 */
@TestProfile(PlatformPluginCatalogConfigTest.ConfiguredCatalogProfile.class)
@QuarkusTest
public class PlatformPluginCatalogConfigTest {

    private static final String PLUGINS_PATH = "/api/v1/platform/plugins";

    public static class ConfiguredCatalogProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of("openerp.platform.plugin-catalog",
                "sales:PLUGIN_SALES_NAME:PLUGIN_SALES_DESCRIPTION,core,inventory,billing:PLUGIN_BILLING_NAME");
        }
    }

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private String superAdminToken;

    @BeforeEach
    public void setup() {
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "plugin-cfg@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
        });
        PlatformTestSupport.clearRedis(redis);
        superAdminToken = given().contentType(ContentType.JSON)
            .body(Map.of("email", PlatformTestSupport.PREFIX + "plugin-cfg@example.com",
                "password", PlatformTestSupport.PASSWORD))
            .when().post("/api/v1/auth/login")
            .then().statusCode(200).extract().path("data.access_token");
    }

    @AfterEach
    public void tearDown() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
        PlatformTestSupport.clearRedis(redis);
    }

    @Test
    @DisplayName("FEAT-20: config CSV bổ sung plugin, dedupe core, key thiếu thì suy diễn i18n key")
    public void testConfiguredCatalogIsMergedAndDeduped() {
        given().header("Authorization", "Bearer " + superAdminToken)
            .when().get(PLUGINS_PATH)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_PLUGIN_LIST_SUCCESS))
            .body("data.items.size()", equalTo(4))
            .body("data.items[0].key", equalTo("core"))
            .body("data.items[0].is_core", equalTo(true))
            .body("data.items[1].key", equalTo("sales"))
            .body("data.items[1].name_key", equalTo("PLUGIN_SALES_NAME"))
            .body("data.items[1].description_key", equalTo("PLUGIN_SALES_DESCRIPTION"))
            .body("data.items[1].is_core", equalTo(false))
            .body("data.items[2].key", equalTo("inventory"))
            .body("data.items[2].name_key", equalTo("PLUGIN_INVENTORY_NAME"))
            .body("data.items[2].description_key", equalTo("PLUGIN_INVENTORY_DESCRIPTION"))
            .body("data.items[2].is_core", equalTo(false))
            .body("data.items[3].key", equalTo("billing"))
            .body("data.items[3].name_key", equalTo("PLUGIN_BILLING_NAME"))
            .body("data.items[3].description_key", equalTo("PLUGIN_BILLING_DESCRIPTION"))
            .body("data.items[3].is_core", equalTo(false));
    }
}
