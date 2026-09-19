package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.ImpersonationStatus;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.model.PlatformImpersonationLog;
import com.vn9melody.openerp.modules.platform.service.ImpersonationService;
import com.vn9melody.openerp.modules.platform.service.PlatformJwtService;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class PlatformTenantApiTest {

    private static final String TENANTS_PATH = "/api/v1/platform/tenants";
    private static final String LOGIN_PATH = "/api/v1/auth/login";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    @Inject
    ImpersonationService impersonationService;

    private String platformToken;
    private UUID tenantId;
    private String tenantSlug;

    @BeforeEach
    public void setup() {
        tenantSlug = PlatformTestSupport.PREFIX + "tenant-" + UUID.randomUUID().toString().substring(0, 8);
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "tenant-admin@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
            User owner = PlatformTestSupport.createUser(PlatformTestSupport.PREFIX + "owner@example.com",
                AccountStatus.ACTIVE, passwordHashService);
            Tenant tenant = PlatformTestSupport.createTenant(tenantSlug, TenantStatus.ACTIVE);
            PlatformTestSupport.addMembership(owner, tenant, UserRole.TENANT_ADMIN);
            tenantId = tenant.id;
        });
        PlatformTestSupport.clearRedis(redis);
        platformToken = login(PlatformTestSupport.PREFIX + "tenant-admin@example.com");
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

    private Response withPlatform(String method, String path, Object body) {
        var request = given().header("Authorization", "Bearer " + platformToken)
            .contentType(ContentType.JSON);
        if (body != null) {
            request = request.body(body);
        }
        return request.when().request(method, path);
    }

    @Test
    @DisplayName("FEAT-10: liệt kê/lọc/chi tiết tenant")
    public void testListAndDetail() {
        withPlatform("GET", TENANTS_PATH + "?keyword=" + tenantSlug, null)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_LIST_SUCCESS))
            .body("data.items.tenant_id", hasItem(tenantId.toString()))
            .body("data.items[0].slug", equalTo(tenantSlug))
            .body("data.page", equalTo(0))
            .body("data.total_items", greaterThanOrEqualTo(1));

        withPlatform("GET", TENANTS_PATH + "/" + tenantId, null)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_DETAIL_SUCCESS))
            .body("data.slug", equalTo(tenantSlug))
            .body("data.active_users_count", equalTo(1))
            .body("data.is_locked", equalTo(false));
    }

    @Test
    @DisplayName("FEAT-10: cập nhật quota + audit, vượt hạn mức trả PLATFORM_TENANT_QUOTA_EXCEEDED")
    public void testUpdateQuotasAndExceeded() {
        withPlatform("PATCH", TENANTS_PATH + "/" + tenantId + "/quotas", Map.of(
                "plan_tier", "ENTERPRISE", "max_users", 50, "max_storage_mb", 51200,
                "allowed_plugins", java.util.List.of("core", "sales")))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_QUOTA_UPDATED))
            .body("data.plan_tier", equalTo("ENTERPRISE"))
            .body("data.max_users", equalTo(50));

        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "TENANT_QUOTA_UPDATE"));

        QuarkusTransaction.requiringNew().run(() -> {
            User second = PlatformTestSupport.createUser(PlatformTestSupport.PREFIX + "owner2@example.com",
                AccountStatus.ACTIVE, passwordHashService);
            Tenant tenant = Tenant.findById(tenantId);
            PlatformTestSupport.addMembership(second, tenant, UserRole.MEMBER);
        });

        withPlatform("PATCH", TENANTS_PATH + "/" + tenantId + "/quotas", Map.of("max_users", 1))
            .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_QUOTA_EXCEEDED));
    }

    @Test
    @DisplayName("FEAT-10/BUG-62: khóa/mở khóa tenant + audit + chặn mutation của tenant bị khóa")
    public void testLockUnlockFlow() {
        withPlatform("POST", TENANTS_PATH + "/" + tenantId + "/lock",
                Map.of("reason", "Chưa thanh toán", "confirm_password", "wrong-password"))
            .then()
            .statusCode(401)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_CONFIRM_PASSWORD_INVALID));

        withPlatform("POST", TENANTS_PATH + "/" + tenantId + "/lock", Map.of("reason", "Chưa thanh toán"))
            .then()
            .statusCode(400)
            .body("code", equalTo(ErrorCode.VALIDATION_REQUIRED));

        withPlatform("POST", TENANTS_PATH + "/" + tenantId + "/lock",
                Map.of("reason", "Chưa thanh toán cước tháng 9",
                    "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_LOCK_SUCCESS))
            .body("data.status", equalTo("SUSPENDED"))
            .body("data.is_locked", equalTo(true));

        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "TENANT_LOCK"));

        // Tenant user mutation must be blocked (TENANT_SUSPENDED).
        String tenantToken = login(PlatformTestSupport.PREFIX + "owner@example.com");
        given().header("Authorization", "Bearer " + tenantToken)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "X", "name", "Blocked"))
            .when().post("/api/v1/organization/branches")
            .then()
            .statusCode(403)
            .body("code", equalTo(PlatformErrorCode.TENANT_SUSPENDED));

        // FEAT-10 AC3: every business API is blocked, including read-only GET.
        given().header("Authorization", "Bearer " + tenantToken)
            .when().get("/api/v1/organization/branches")
            .then()
            .statusCode(403)
            .body("code", equalTo(PlatformErrorCode.TENANT_SUSPENDED));

        withPlatform("POST", TENANTS_PATH + "/" + tenantId + "/unlock",
                Map.of("confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_UNLOCK_SUCCESS))
            .body("data.status", equalTo("ACTIVE"))
            .body("data.is_locked", equalTo(false));
    }

    @Test
    @DisplayName("FEAT-10: chặn tự khóa tenant sở hữu tài khoản Super Admin")
    public void testSelfLockForbidden() {
        QuarkusTransaction.requiringNew().run(() -> {
            User adminUser = User.findByEmail(PlatformTestSupport.PREFIX + "tenant-admin@example.com");
            Tenant tenant = Tenant.findById(tenantId);
            PlatformTestSupport.addMembership(adminUser, tenant, UserRole.TENANT_ADMIN);
        });

        withPlatform("POST", TENANTS_PATH + "/" + tenantId + "/lock",
                Map.of("reason", "self", "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(403)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_SELF_LOCK_FORBIDDEN));
    }

    @Test
    @DisplayName("BUG-74: danh sách tenant trả allowed_plugins để drawer hạn mức đọc đúng trạng thái")
    public void testListIncludesAllowedPlugins() {
        withPlatform("PATCH", TENANTS_PATH + "/" + tenantId + "/quotas",
                Map.of("allowed_plugins", java.util.List.of("core", "sales")))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_QUOTA_UPDATED));

        withPlatform("GET", TENANTS_PATH + "?keyword=" + tenantSlug, null)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_LIST_SUCCESS))
            .body("data.items[0].tenant_id", equalTo(tenantId.toString()))
            .body("data.items[0].allowed_plugins", hasItems("core", "sales"));
    }

    @Test
    @DisplayName("FEAT-20: PATCH quotas tự thêm core khi thiếu và không cho gỡ core")
    public void testQuotasAlwaysKeepCorePlugin() {
        withPlatform("PATCH", TENANTS_PATH + "/" + tenantId + "/quotas",
                Map.of("allowed_plugins", java.util.List.of("sales")))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_QUOTA_UPDATED))
            .body("data.allowed_plugins", hasItems("core", "sales"));

        QuarkusTransaction.requiringNew().run(() -> {
            Tenant tenant = Tenant.findById(tenantId);
            assertEquals(2, tenant.allowedPlugins.size());
            assertTrue(tenant.allowedPlugins.stream().anyMatch("core"::equalsIgnoreCase));
            assertTrue(tenant.allowedPlugins.stream().anyMatch("sales"::equalsIgnoreCase));
        });
    }

    @Test
    @DisplayName("BUG-78: phiên impersonation quá TTL không chặn khóa tenant, log chuyển TIMEOUT + audit SYSTEM")
    public void testExpiredImpersonationDoesNotBlockLock() {
        UUID logId = QuarkusTransaction.requiringNew().call(() -> {
            User adminUser = User.findByEmail(PlatformTestSupport.PREFIX + "tenant-admin@example.com");
            User owner = User.findByEmail(PlatformTestSupport.PREFIX + "owner@example.com");
            PlatformImpersonationLog log = new PlatformImpersonationLog();
            log.superAdminUserId = adminUser.id;
            log.targetTenantId = tenantId;
            log.targetUserId = owner.id;
            log.reason = "support abandoned";
            log.supportTicket = "TCK-S2PLAT-TIMEOUT";
            log.ipAddress = "127.0.0.1";
            log.status = ImpersonationStatus.STARTED;
            log.startedAt = Instant.now().minusSeconds(PlatformJwtService.IMPERSONATION_TTL_SECONDS + 60);
            log.persist();
            return log.id;
        });

        withPlatform("POST", TENANTS_PATH + "/" + tenantId + "/lock",
                Map.of("reason", "Phiên đại diện bỏ hoang", "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_LOCK_SUCCESS))
            .body("data.is_locked", equalTo(true));

        QuarkusTransaction.requiringNew().run(() -> {
            Object[] row = (Object[]) entityManager.createNativeQuery(
                    "SELECT status, ended_at FROM platform_impersonation_logs WHERE id = :id")
                .setParameter("id", logId)
                .getSingleResult();
            assertEquals("TIMEOUT", row[0].toString());
            assertNotNull(row[1], "ended_at must be stamped when a session times out");
        });
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "IMPERSONATION_TIMEOUT"));

        // Idempotent: a second sweep closes nothing and adds no duplicate audit entry.
        int closed = QuarkusTransaction.requiringNew()
            .call(() -> impersonationService.closeExpiredSessions(Instant.now(), tenantId));
        assertEquals(0, closed);
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "IMPERSONATION_TIMEOUT"));
    }

    @Test
    @DisplayName("FEAT-10: chặn khóa tenant đang có phiên impersonation hoạt động")
    public void testLockBlockedDuringImpersonation() {
        QuarkusTransaction.requiringNew().run(() -> {
            User adminUser = User.findByEmail(PlatformTestSupport.PREFIX + "tenant-admin@example.com");
            User owner = User.findByEmail(PlatformTestSupport.PREFIX + "owner@example.com");
            PlatformImpersonationLog log = new PlatformImpersonationLog();
            log.superAdminUserId = adminUser.id;
            log.targetTenantId = tenantId;
            log.targetUserId = owner.id;
            log.reason = "support";
            log.supportTicket = "TCK-S2PLAT";
            log.ipAddress = "127.0.0.1";
            log.status = ImpersonationStatus.STARTED;
            log.startedAt = Instant.now();
            log.persist();
        });

        withPlatform("POST", TENANTS_PATH + "/" + tenantId + "/lock",
                Map.of("reason", "conflict", "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(409)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_IMPERSONATION_ACTIVE));
    }
}
