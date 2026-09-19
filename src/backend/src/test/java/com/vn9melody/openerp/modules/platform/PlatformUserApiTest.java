package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.PasswordResetToken;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserTwoFactor;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class PlatformUserApiTest {

    private static final String USERS_PATH = "/api/v1/platform/users";
    private static final String LOGIN_PATH = "/api/v1/auth/login";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    SessionManager sessionManager;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private String platformToken;
    private UUID targetUserId;
    private String targetEmail;

    @BeforeEach
    public void setup() {
        targetEmail = PlatformTestSupport.PREFIX + "user-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "user-admin@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
            User target = PlatformTestSupport.createUser(targetEmail, AccountStatus.ACTIVE, passwordHashService);
            Tenant tenant = PlatformTestSupport.createTenant(PlatformTestSupport.PREFIX + "user-tenant",
                TenantStatus.ACTIVE);
            PlatformTestSupport.addMembership(target, tenant, UserRole.TENANT_ADMIN);
            targetUserId = target.id;
        });
        PlatformTestSupport.clearRedis(redis);
        platformToken = login(PlatformTestSupport.PREFIX + "user-admin@example.com");
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
    @DisplayName("FEAT-11: danh sách user toàn cục, khóa/mở khóa + thu hồi session")
    public void testListLockUnlock() {
        String targetToken = login(targetEmail);
        assertTrue(!sessionManager.getUserSessions(targetUserId).isEmpty());

        withPlatform("GET", USERS_PATH + "?keyword=" + targetEmail, null)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_USER_LIST_SUCCESS))
            .body("data.items.user_id", hasItem(targetUserId.toString()))
            .body("data.total_items", greaterThanOrEqualTo(1));

        withPlatform("POST", USERS_PATH + "/" + targetUserId + "/lock", Map.of("reason", "fraud suspicion"))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_USER_LOCKED_SUCCESS))
            .body("data.status", equalTo("LOCKED"));

        assertTrue(sessionManager.getUserSessions(targetUserId).isEmpty());
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "USER_GLOBAL_LOCK"));

        given().header("Authorization", "Bearer " + targetToken)
            .when().get("/api/v1/account/profile")
            .then().statusCode(401);

        withPlatform("POST", USERS_PATH + "/" + targetUserId + "/unlock", null)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_USER_UNLOCKED_SUCCESS))
            .body("data.status", equalTo("ACTIVE"));
    }

    @Test
    @DisplayName("FEAT-11: chặn tự khóa chính mình")
    public void testSelfLockForbidden() {
        UUID adminUserId = QuarkusTransaction.requiringNew().call(() ->
            User.findByEmail(PlatformTestSupport.PREFIX + "user-admin@example.com").id);

        withPlatform("POST", USERS_PATH + "/" + adminUserId + "/lock", Map.of("reason", "self"))
            .then()
            .statusCode(403)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_SELF_DISABLE_FORBIDDEN));
    }

    @Test
    @DisplayName("FEAT-11: buộc đặt lại mật khẩu phát token + audit")
    public void testForcePasswordReset() {
        withPlatform("POST", USERS_PATH + "/" + targetUserId + "/force-password-reset",
                Map.of("reason", "account takeover suspected"))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_USER_PASSWORD_RESET_FORCED))
            .body("data.reset_token_sent", equalTo(true));

        assertNotNull(QuarkusTransaction.requiringNew().call(() ->
            PasswordResetToken.find("user.id", targetUserId).firstResult()));
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "USER_FORCE_PASSWORD_RESET"));
    }

    @Test
    @DisplayName("FEAT-11/BUG-56: break-glass tắt 2FA + audit critical + email cảnh báo")
    public void testBreakGlassDisable2Fa() {
        QuarkusTransaction.requiringNew().run(() -> {
            User target = User.findById(targetUserId);
            UserTwoFactor twoFactor = new UserTwoFactor();
            twoFactor.user = target;
            twoFactor.userId = target.id;
            twoFactor.secretKeyEnc = "enc";
            twoFactor.isEnabled = true;
            twoFactor.persist();
        });

        withPlatform("POST", USERS_PATH + "/" + targetUserId + "/break-glass", Map.of(
                "action", "DISABLE_2FA",
                "support_ticket", "TCK-S2PLAT-2FA",
                "reason", "lost device",
                "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_USER_2FA_DISABLED_BY_BREAK_GLASS))
            .body("data.is_2fa_enabled", equalTo(false));

        assertNull(QuarkusTransaction.requiringNew().call(() ->
            UserTwoFactor.findByUserId(targetUserId)));
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "USER_BREAK_GLASS_DISABLE_2FA"));

        withPlatform("POST", USERS_PATH + "/" + targetUserId + "/break-glass", Map.of(
                "action", "NOT_AN_ACTION",
                "support_ticket", "TCK-S2PLAT-2FA",
                "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(400)
            .body("code", equalTo(ErrorCode.VALIDATION_INVALID));
    }
}
