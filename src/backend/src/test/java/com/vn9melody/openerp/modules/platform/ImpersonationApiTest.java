package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import io.restassured.response.Response;
import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class ImpersonationApiTest {

    private static final String LOGIN_PATH = "/api/v1/auth/login";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    JWTParser jwtParser;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private String adminToken;
    private UUID tenantId;
    private UUID ownerId;
    private UUID adminUserId;

    @BeforeEach
    public void setup() {
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            var admin = PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "imp-admin@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
            adminUserId = admin.userId;
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "imp-support@example.com",
                PlatformAdminRole.SUPPORT_ENGINEER, PlatformAdminStatus.ACTIVE, passwordHashService);
            User owner = PlatformTestSupport.createUser(PlatformTestSupport.PREFIX + "imp-owner@example.com",
                AccountStatus.ACTIVE, passwordHashService);
            Tenant tenant = PlatformTestSupport.createTenant(PlatformTestSupport.PREFIX + "imp-tenant",
                TenantStatus.ACTIVE);
            PlatformTestSupport.addMembership(owner, tenant, UserRole.TENANT_ADMIN);
            tenantId = tenant.id;
            ownerId = owner.id;
        });
        PlatformTestSupport.clearRedis(redis);
        adminToken = login(PlatformTestSupport.PREFIX + "imp-admin@example.com");
    }

    @AfterEach
    public void tearDown() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
        PlatformTestSupport.clearRedis(redis);
    }

    private String login(String email) {
        return given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", PlatformTestSupport.PASSWORD))
            .when().post(LOGIN_PATH)
            .then().statusCode(200).extract().path("data.access_token");
    }

    private Response startImpersonation(String token, UUID targetTenantId, Map<String, Object> body) {
        return given().header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(body)
            .when().post("/api/v1/platform/tenants/" + targetTenantId + "/impersonate");
    }

    private Map<String, Object> validBody(String targetUserId) {
        Map<String, Object> body = new java.util.HashMap<>();
        if (targetUserId != null) {
            body.put("target_user_id", targetUserId);
        }
        body.put("support_ticket", "TCK-S2PLAT-001");
        body.put("reason", "Khách hàng báo lỗi báo cáo doanh thu");
        body.put("confirm_password", PlatformTestSupport.PASSWORD);
        return body;
    }

    @Test
    @DisplayName("FEAT-11/BUG-57: impersonation start + exit + audit + log lifecycle")
    public void testStartAndExitImpersonation() throws Exception {
        Response started = startImpersonation(adminToken, tenantId, validBody(ownerId.toString()))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_IMPERSONATION_STARTED))
            .body("data.impersonation_token", not(emptyOrNullString()))
            .body("data.expires_in_seconds", equalTo(1800))
            .body("data.target_user_id", equalTo(ownerId.toString()))
            .extract().response();

        String impersonationToken = started.path("data.impersonation_token");
        JsonWebToken jwt = jwtParser.parse(impersonationToken);
        Object isImpersonation = jwt.getClaim("is_impersonation");
        assertEquals("true", String.valueOf(isImpersonation).toLowerCase());
        assertNull(jwt.getClaim("platform_role"));
        assertEquals(ownerId.toString(), jwt.getSubject());
        assertEquals(adminUserId.toString(), jwt.getClaim("act_sub"));
        assertEquals(tenantId.toString(), jwt.getClaim("tenant_id"));

        given().header("Authorization", "Bearer " + adminToken)
            .when().get("/api/v1/platform/impersonation-logs?tenant_id=" + tenantId)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_IMPERSONATION_LOG_LIST_SUCCESS))
            .body("data.items.status", hasItem("STARTED"));

        given().header("Authorization", "Bearer " + impersonationToken)
            .when().post("/api/v1/platform/impersonate/exit")
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_IMPERSONATION_ENDED))
            .body("data", org.hamcrest.Matchers.nullValue());

        String status = QuarkusTransaction.requiringNew().call(() -> entityManager.createNativeQuery(
                "SELECT status FROM platform_impersonation_logs WHERE target_tenant_id = :tenantId")
            .setParameter("tenantId", tenantId)
            .getSingleResult().toString());
        assertEquals("ENDED", status);
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "IMPERSONATION_START"));
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "IMPERSONATION_END"));

        // Second exit must fail: the Redis marker is gone.
        given().header("Authorization", "Bearer " + impersonationToken)
            .when().post("/api/v1/platform/impersonate/exit")
            .then()
            .statusCode(401)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_IMPERSONATION_SESSION_EXPIRED));
    }

    @Test
    @DisplayName("BUG-57: bỏ trống target_user_id tự chọn TENANT_OWNER/TENANT_ADMIN")
    public void testAutoTargetSelection() {
        startImpersonation(adminToken, tenantId, validBody(null))
            .then()
            .statusCode(200)
            .body("data.target_user_id", equalTo(ownerId.toString()));
    }

    @Test
    @DisplayName("BUG-57: tenant không có thành viên trả PLATFORM_IMPERSONATION_TARGET_NOT_FOUND")
    public void testTargetNotFound() {
        UUID emptyTenantId = QuarkusTransaction.requiringNew().call(() -> {
            Tenant tenant = PlatformTestSupport.createTenant(
                PlatformTestSupport.PREFIX + "imp-empty-" + UUID.randomUUID().toString().substring(0, 6),
                TenantStatus.ACTIVE);
            return tenant.id;
        });

        startImpersonation(adminToken, emptyTenantId, validBody(null))
            .then()
            .statusCode(400)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_IMPERSONATION_TARGET_NOT_FOUND));
    }

    @Test
    @DisplayName("FEAT-11: không impersonate tenant bị khóa")
    public void testLockedTenantRejected() {
        QuarkusTransaction.requiringNew().run(() -> {
            Tenant tenant = Tenant.findById(tenantId);
            tenant.status = TenantStatus.SUSPENDED;
            tenant.isLocked = true;
            tenant.persist();
        });

        startImpersonation(adminToken, tenantId, validBody(ownerId.toString()))
            .then()
            .statusCode(409)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_IMPERSONATION_TENANT_LOCKED));
    }

    @Test
    @DisplayName("FEAT-11: SUPPORT_ENGINEER bị từ chối impersonation")
    public void testSupportEngineerForbidden() {
        String supportToken = login(PlatformTestSupport.PREFIX + "imp-support@example.com");

        startImpersonation(supportToken, tenantId, validBody(ownerId.toString()))
            .then()
            .statusCode(403)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_IMPERSONATION_FORBIDDEN));
    }

    @Test
    @DisplayName("FEAT-11: không impersonate platform admin")
    public void testPlatformAdminTargetRejected() {
        startImpersonation(adminToken, tenantId, validBody(adminUserId.toString()))
            .then()
            .statusCode(400)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_IMPERSONATION_TARGET_NOT_FOUND));
    }
}
