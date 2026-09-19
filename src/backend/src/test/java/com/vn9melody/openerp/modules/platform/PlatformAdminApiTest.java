package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.cli.PlatformAdminCli;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.platform.service.PlatformAdminService;
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
public class PlatformAdminApiTest {

    private static final String ADMINS_PATH = "/api/v1/platform/admins";
    private static final String LOGIN_PATH = "/api/v1/auth/login";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    PlatformAdminService platformAdminService;

    @Inject
    PlatformAdminCli platformAdminCli;

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private String adminEmail;
    private String secondEmail;
    private UUID adminId;
    private UUID secondAdminId;
    private String adminToken;
    private String secondToken;

    @BeforeEach
    public void setup() {
        adminEmail = PlatformTestSupport.PREFIX + "adm-a@example.com";
        secondEmail = PlatformTestSupport.PREFIX + "adm-b@example.com";
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            var first = PlatformTestSupport.createPlatformAdmin(adminEmail, PlatformAdminRole.SUPER_ADMIN,
                PlatformAdminStatus.ACTIVE, passwordHashService);
            var second = PlatformTestSupport.createPlatformAdmin(secondEmail, PlatformAdminRole.SUPER_ADMIN,
                PlatformAdminStatus.ACTIVE, passwordHashService);
            adminId = first.id;
            secondAdminId = second.id;
        });
        PlatformTestSupport.clearRedis(redis);
        adminToken = login(adminEmail);
        secondToken = login(secondEmail);
    }

    @AfterEach
    public void tearDown() {
        System.clearProperty("openerp.platform.bootstrap-secret");
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
        PlatformTestSupport.clearRedis(redis);
    }

    private String login(String email) {
        return given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", PlatformTestSupport.PASSWORD))
            .when().post(LOGIN_PATH)
            .then().statusCode(200).extract().path("data.access_token");
    }

    private Response withAdmin(String method, String path, Object body) {
        var request = given().header("Authorization", "Bearer " + adminToken)
            .contentType(ContentType.JSON);
        if (body != null) {
            request = request.body(body);
        }
        return request.when().request(method, path);
    }

    @Test
    @DisplayName("FEAT-18: list + grant existing/new user (không tạo trùng)")
    public void testListAndGrant() {
        withAdmin("GET", ADMINS_PATH, null)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_LIST_SUCCESS))
            .body("data.items.admin_id", hasItem(adminId.toString()))
            .body("data.items.email", hasItem(adminEmail));

        String existingEmail = PlatformTestSupport.PREFIX + "adm-existing@example.com";
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.createUser(
            existingEmail, AccountStatus.ACTIVE, passwordHashService));

        withAdmin("POST", ADMINS_PATH, Map.of("email", existingEmail, "role", "SUPPORT_ENGINEER"))
            .then()
            .statusCode(201)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_GRANTED))
            .body("data.status", equalTo("ACTIVE"))
            .body("data.role", equalTo("SUPPORT_ENGINEER"));

        long usersBefore = User.count();
        String newEmail = PlatformTestSupport.PREFIX + "adm-new@example.com";
        withAdmin("POST", ADMINS_PATH, Map.of("email", newEmail, "role", "SUPER_ADMIN", "full_name", "New Admin"))
            .then()
            .statusCode(201)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_INVITATION_SENT))
            .body("data.status", equalTo("INVITED"));

        assertEquals(usersBefore + 1, User.count());

        withAdmin("POST", ADMINS_PATH, Map.of("email", newEmail, "role", "SUPER_ADMIN"))
            .then()
            .statusCode(201)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_GRANTED));

        assertEquals(usersBefore + 1, User.count());
        assertEquals(1L, PlatformSuperAdmin.count("userId", User.findByEmail(newEmail).id));

        withAdmin("POST", ADMINS_PATH, Map.of("email", newEmail, "role", "NOT_A_ROLE"))
            .then()
            .statusCode(400)
            .body("code", equalTo(ErrorCode.VALIDATION_INVALID));
    }

    @Test
    @DisplayName("FEAT-18/TC-BE-29: tự disable chính mình bị chặn")
    public void testSelfDisableForbidden() {
        withAdmin("POST", ADMINS_PATH + "/" + adminId + "/disable",
                Map.of("reason", "self", "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(403)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_SELF_DISABLE_FORBIDDEN));

        withAdmin("DELETE", ADMINS_PATH + "/" + adminId, Map.of("reason", "self"))
            .then()
            .statusCode(403)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_SELF_DISABLE_FORBIDDEN));
    }

    @Test
    @DisplayName("FEAT-18/TC-BE-30: admin ACTIVE cuối cùng được bảo vệ (service-level, không race)")
    public void testLastAdminProtected() {
        // A disables B through the API (2 active admins → allowed).
        withAdmin("POST", ADMINS_PATH + "/" + secondAdminId + "/disable",
                Map.of("reason", "offboarding", "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_DISABLED));

        // Create a disabled admin to act as the (offline) caller of the last-admin guard.
        String disabledEmail = PlatformTestSupport.PREFIX + "adm-c@example.com";
        UUID disabledUserId = QuarkusTransaction.requiringNew().call(() -> {
            var disabled = PlatformTestSupport.createPlatformAdmin(disabledEmail, PlatformAdminRole.SUPER_ADMIN,
                PlatformAdminStatus.DISABLED, passwordHashService);
            return disabled.userId;
        });

        PlatformActor actor = PlatformActor.of(disabledUserId, disabledEmail,
            PlatformAdminRole.SUPER_ADMIN, "local-console", "test");
        var exception = org.junit.jupiter.api.Assertions.assertThrows(
            com.vn9melody.openerp.core.api.ApiException.class,
            () -> platformAdminService.disable(adminId, "last one", PlatformTestSupport.PASSWORD, actor));
        assertEquals(PlatformErrorCode.PLATFORM_LAST_ADMIN_PROTECTED, exception.getErrorCode());
        assertEquals(409, exception.getHttpStatus());
    }

    @Test
    @DisplayName("FEAT-18/TC-BE-31: disable thu hồi session tức thì, enable khôi phục")
    public void testDisableRevokesSessionsAndEnable() {
        withAdmin("POST", ADMINS_PATH + "/" + secondAdminId + "/disable",
                Map.of("reason", "offboarding", "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_DISABLED))
            .body("data.status", equalTo("DISABLED"));

        given().header("Authorization", "Bearer " + secondToken)
            .when().get("/api/v1/platform/tenants")
            .then().statusCode(401);

        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "PLATFORM_ADMIN_DISABLED"));

        withAdmin("POST", ADMINS_PATH + "/" + secondAdminId + "/enable", null)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_ENABLED))
            .body("data.status", equalTo("ACTIVE"));

        assertNotNull(login(secondEmail));
    }

    @Test
    @DisplayName("FEAT-18: revoke là trạng thái kết thúc; reset-password + break-glass 2FA")
    public void testRevokeResetAndBreakGlass() {
        withAdmin("DELETE", ADMINS_PATH + "/" + secondAdminId, Map.of("reason", "left company"))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_REVOKED))
            .body("data.status", equalTo("REVOKED"));

        withAdmin("POST", ADMINS_PATH + "/" + secondAdminId + "/enable", null)
            .then().statusCode(409);

        withAdmin("POST", ADMINS_PATH + "/" + secondAdminId + "/reset-password", null)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_PASSWORD_RESET_SENT))
            .body("data.reset_token_sent", equalTo(true));

        withAdmin("POST", ADMINS_PATH + "/" + secondAdminId + "/disable-2fa", Map.of(
                "support_ticket", "TCK-S2PLAT-ADM",
                "reason", "lost device",
                "confirm_password", PlatformTestSupport.PASSWORD))
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ADMIN_2FA_DISABLED));

        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "PLATFORM_ADMIN_2FA_DISABLED"));
    }

    @Test
    @DisplayName("TASK-295/TC-BE-32: offline CLI list/grant/revoke ghi audit actor_type=CLI")
    public void testOfflineCli() {
        System.setProperty("openerp.platform.bootstrap-secret", "s2plat-cli-secret");

        assertEquals(0, platformAdminCli.execute(new String[]{"list-admins"}));

        String cliEmail = PlatformTestSupport.PREFIX + "adm-cli@example.com";
        assertEquals(0, platformAdminCli.execute(new String[]{"grant-admin", "--email", cliEmail,
            "--role", "SUPPORT_ENGINEER"}));

        User cliUser = User.findByEmail(cliEmail);
        assertNotNull(cliUser);
        PlatformSuperAdmin cliAdmin = superAdminRepository.findByUserId(cliUser.id);
        assertNotNull(cliAdmin);
        assertEquals(PlatformAdminRole.SUPPORT_ENGINEER, cliAdmin.role);

        assertEquals(0, platformAdminCli.execute(new String[]{"revoke-admin", "--email", cliEmail}));
        PlatformAdminStatus revokedStatus = QuarkusTransaction.requiringNew().call(() ->
            superAdminRepository.findByUserId(cliUser.id).status);
        assertEquals(PlatformAdminStatus.REVOKED, revokedStatus);

        Object cliAuditCount = QuarkusTransaction.requiringNew().call(() -> entityManager.createNativeQuery(
                "SELECT count(*) FROM platform_audit_logs WHERE actor_type = 'CLI'").getSingleResult());
        assertTrue(((Number) cliAuditCount).longValue() >= 2);

        // Wrong/missing secret is rejected.
        System.clearProperty("openerp.platform.bootstrap-secret");
        assertFalse(platformAdminCli.execute(new String[]{"list-admins"}) == 0);
    }

    @Test
    @DisplayName("FEAT-18/AC1: API đăng ký công khai không tạo được platform admin")
    public void testPublicRegistrationCannotCreatePlatformAdmin() {
        String email = PlatformTestSupport.PREFIX + "public-reg@example.com";
        given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", PlatformTestSupport.PASSWORD, "full_name", "Public User",
                "role", "SUPER_ADMIN", "platform_role", "SUPER_ADMIN"))
            .when().post("/api/v1/auth/register/personal")
            .then().statusCode(201);

        User user = User.findByEmail(email);
        assertNotNull(user);
        assertFalse(superAdminRepository.findByUserId(user.id) != null);
        assertTrue(PlatformSuperAdmin.count("userId", user.id) == 0);
    }
}
