package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BUG-79 backend contract: every {@code Instant} field is serialized as ISO-8601
 * UTC with the {@code Z} suffix (never an epoch number), so the frontend can
 * convert to the browser locale/timezone.
 */
@QuarkusTest
public class PlatformTimestampUtcApiTest {

    private static final String TENANTS_PATH = "/api/v1/platform/tenants";
    private static final String AUDIT_PATH = "/api/v1/platform/audit-logs";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private String token;
    private UUID tenantId;
    private String tenantSlug;

    @BeforeEach
    public void setup() {
        tenantSlug = PlatformTestSupport.PREFIX + "ts-" + UUID.randomUUID().toString().substring(0, 8);
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "ts-admin@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
            User owner = PlatformTestSupport.createUser(PlatformTestSupport.PREFIX + "ts-owner@example.com",
                AccountStatus.ACTIVE, passwordHashService);
            Tenant tenant = PlatformTestSupport.createTenant(tenantSlug, TenantStatus.ACTIVE);
            PlatformTestSupport.addMembership(owner, tenant, UserRole.TENANT_ADMIN);
            tenantId = tenant.id;
        });
        PlatformTestSupport.clearRedis(redis);
        token = given().contentType(ContentType.JSON)
            .body(Map.of("email", PlatformTestSupport.PREFIX + "ts-admin@example.com",
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
    @DisplayName("BUG-79: created_at tenant trả ISO-8601 UTC có hậu tố Z")
    public void testTenantCreatedAtIsUtcIso() {
        String createdAt = given().header("Authorization", "Bearer " + token)
            .when().get(TENANTS_PATH + "?keyword=" + tenantSlug)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_LIST_SUCCESS))
            .body("data.items[0].created_at", endsWith("Z"))
            .extract().path("data.items[0].created_at");

        assertNotNull(createdAt);
        assertTrue(createdAt.endsWith("Z"), "expected UTC Z suffix but was: " + createdAt);
        Instant.parse(createdAt);
    }

    @Test
    @DisplayName("BUG-79: created_at audit log trả ISO-8601 UTC có hậu tố Z")
    public void testAuditCreatedAtIsUtcIso() {
        given().header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(Map.of("max_storage_mb", 4096))
            .when().patch(TENANTS_PATH + "/" + tenantId + "/quotas")
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_QUOTA_UPDATED));

        String createdAt = given().header("Authorization", "Bearer " + token)
            .when().get(AUDIT_PATH + "?size=1")
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_AUDIT_LOG_LIST_SUCCESS))
            .body("data.items[0].created_at", endsWith("Z"))
            .extract().path("data.items[0].created_at");

        assertNotNull(createdAt);
        assertTrue(createdAt.endsWith("Z"), "expected UTC Z suffix but was: " + createdAt);
        Instant.parse(createdAt);
    }
}
