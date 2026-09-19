package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * FEAT-20 backend: {@code GET /api/v1/platform/plugins} returns the plugin catalog
 * as a non-paginated list and is restricted to SUPER_ADMIN.
 */
@QuarkusTest
public class PlatformPluginApiTest {

    private static final String PLUGINS_PATH = "/api/v1/platform/plugins";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private String superAdminToken;
    private String supportToken;

    @BeforeEach
    public void setup() {
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "plugin-sa@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "plugin-support@example.com",
                PlatformAdminRole.SUPPORT_ENGINEER, PlatformAdminStatus.ACTIVE, passwordHashService);
        });
        PlatformTestSupport.clearRedis(redis);
        superAdminToken = login(PlatformTestSupport.PREFIX + "plugin-sa@example.com");
        supportToken = login(PlatformTestSupport.PREFIX + "plugin-support@example.com");
    }

    @AfterEach
    public void tearDown() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
        PlatformTestSupport.clearRedis(redis);
    }

    @Test
    @DisplayName("FEAT-20: SUPER_ADMIN nhận catalog plugin dạng data.items với i18n keys")
    public void testPluginCatalogForSuperAdmin() {
        given().header("Authorization", "Bearer " + superAdminToken)
            .when().get(PLUGINS_PATH)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_PLUGIN_LIST_SUCCESS))
            .body("data.items[0].key", equalTo("core"))
            .body("data.items[0].name_key", not(emptyOrNullString()))
            .body("data.items[0].description_key", not(emptyOrNullString()))
            .body("data.items[0].is_core", equalTo(true));
    }

    @Test
    @DisplayName("FEAT-20: không cấu hình openerp.platform.plugin-catalog → catalog chỉ có core")
    public void testCatalogWithoutConfigContainsOnlyCore() {
        given().header("Authorization", "Bearer " + superAdminToken)
            .when().get(PLUGINS_PATH)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_PLUGIN_LIST_SUCCESS))
            .body("data.items.size()", equalTo(1))
            .body("data.items[0].key", equalTo("core"))
            .body("data.items[0].is_core", equalTo(true));
    }

    @Test
    @DisplayName("FEAT-20: SUPPORT_ENGINEER bị từ chối đọc catalog (chỉ SUPER_ADMIN)")
    public void testPluginCatalogForbiddenForSupportEngineer() {        given().header("Authorization", "Bearer " + supportToken)
            .when().get(PLUGINS_PATH)
            .then()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ACCESS_DENIED));
    }

    @Test
    @DisplayName("FEAT-20: thiếu token trả 401 UNAUTHORIZED")
    public void testPluginCatalogRequiresToken() {
        given()
            .when().get(PLUGINS_PATH)
            .then()
            .statusCode(401)
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));
    }

    private String login(String email) {
        return given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", PlatformTestSupport.PASSWORD))
            .when().post("/api/v1/auth/login")
            .then().statusCode(200).extract().path("data.access_token");
    }
}
