package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.oneOf;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantStatus;
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

@QuarkusTest
public class PlatformHealthApiTest {

    private static final String HEALTH_PATH = "/api/v1/platform/health";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private String platformToken;

    @BeforeEach
    public void setup() {
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "health-admin@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
            PlatformTestSupport.createTenant(PlatformTestSupport.PREFIX + "health-tenant", TenantStatus.ACTIVE);
        });
        PlatformTestSupport.clearRedis(redis);
        platformToken = given().contentType(ContentType.JSON)
            .body(Map.of("email", PlatformTestSupport.PREFIX + "health-admin@example.com",
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
    @DisplayName("FEAT-12/BUG-64: health trả DB/Redis UP, Kafka UNKNOWN → DEGRADED")
    public void testHealth() {
        given().header("Authorization", "Bearer " + platformToken)
            .when().get(HEALTH_PATH)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_HEALTH_CHECK_SUCCESS))
            .body("data.system_status", oneOf("HEALTHY", "DEGRADED", "DOWN"))
            .body("data.database.primary", equalTo("UP"))
            .body("data.redis.status", equalTo("UP"))
            .body("data.kafka.status", equalTo("UNKNOWN"))
            .body("data.kafka.nodes_count", equalTo(0))
            .body("data.platform_metrics.total_tenants", greaterThanOrEqualTo(1))
            .body("data.platform_metrics.total_users", greaterThanOrEqualTo(1));

        // Minimal dev profile: Kafka + replica are optional → overall DEGRADED.
        given().header("Authorization", "Bearer " + platformToken)
            .when().get(HEALTH_PATH)
            .then()
            .body("data.system_status", equalTo("DEGRADED"));
    }

    @Test
    @DisplayName("FEAT-12: health yêu cầu platform token")
    public void testHealthRequiresPlatformToken() {
        given().when().get(HEALTH_PATH)
            .then()
            .statusCode(401)
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));
    }
}
