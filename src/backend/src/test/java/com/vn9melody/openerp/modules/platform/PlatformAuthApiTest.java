package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import com.vn9melody.openerp.modules.platform.service.PlatformBootstrapService;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class PlatformAuthApiTest {

    private static final String LOGIN_PATH = "/api/v1/auth/login";
    private static final String TENANTS_PATH = "/api/v1/platform/tenants";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Inject
    PlatformBootstrapService bootstrapService;

    @Inject
    JWTParser jwtParser;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    @BeforeEach
    @Transactional
    public void setup() {
        PlatformTestSupport.cleanup(entityManager);
        PlatformTestSupport.clearRedis(redis);
    }

    @AfterEach
    @Transactional
    public void tearDown() {
        PlatformTestSupport.cleanup(entityManager);
        PlatformTestSupport.clearRedis(redis);
    }

    private Response login(String email, String password) {
        return given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", password))
            .when().post(LOGIN_PATH);
    }

    @Test
    @DisplayName("BUG-65/TC-BE-01: platform admin login phát JWT platform_role + groups, tenant token bị 403")
    public void testPlatformLoginAndTenantTokenDenied() throws Exception {
        String adminEmail = PlatformTestSupport.PREFIX + "auth-admin@example.com";
        String tenantEmail = PlatformTestSupport.PREFIX + "auth-tenant@example.com";
        io.quarkus.narayana.jta.QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.createPlatformAdmin(adminEmail, PlatformAdminRole.SUPER_ADMIN,
                PlatformAdminStatus.ACTIVE, passwordHashService);
            var tenantUser = PlatformTestSupport.createUser(tenantEmail, AccountStatus.ACTIVE, passwordHashService);
            var tenant = PlatformTestSupport.createTenant(PlatformTestSupport.PREFIX + "auth-tenant",
                com.vn9melody.openerp.core.enums.TenantStatus.ACTIVE);
            PlatformTestSupport.addMembership(tenantUser, tenant, com.vn9melody.openerp.core.enums.UserRole.TENANT_ADMIN);
        });

        Response login = login(adminEmail, PlatformTestSupport.PASSWORD)
            .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.AUTH_LOGIN_SUCCESS))
            .body("data.access_token", not(emptyOrNullString()))
            .body("data.user.role", equalTo("SUPER_ADMIN"))
            .body("data.user.tenant_id", org.hamcrest.Matchers.nullValue())
            .extract().response();

        String platformToken = login.path("data.access_token");
        JsonWebToken jwt = jwtParser.parse(platformToken);
        assertEquals("SUPER_ADMIN", jwt.getClaim("platform_role"));
        assertEquals("PLATFORM", jwt.getClaim("scope"));
        assertTrue(jwt.getGroups().contains("SUPER_ADMIN"));
        assertNull(jwt.getClaim("tenant_id"));

        String tenantToken = login(tenantEmail, PlatformTestSupport.PASSWORD)
            .then().statusCode(200).extract().path("data.access_token");
        JsonWebToken tenantJwt = jwtParser.parse(tenantToken);
        assertNull(tenantJwt.getClaim("platform_role"));

        given().header("Authorization", "Bearer " + tenantToken)
            .when().get(TENANTS_PATH)
            .then()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo(PlatformErrorCode.PLATFORM_ACCESS_DENIED));

        given().when().get(TENANTS_PATH)
            .then()
            .statusCode(401)
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("TASK-274: bootstrap idempotent tạo/nâng cấp admin và audit SYSTEM")
    public void testBootstrapIdempotent() {
        String email = PlatformTestSupport.PREFIX + "bootstrap@example.com";

        PlatformBootstrapService.BootstrapResult first = bootstrapService.runBootstrap(List.of(email));
        assertTrue(first.ran);
        assertEquals(1, first.createdUsers);
        assertEquals(1, first.grantedAdmins);

        User user = User.findByEmail(email);
        assertNotNull(user);
        assertEquals(AccountStatus.ACTIVE, user.status);
        assertNotNull(user.emailVerifiedAt);

        PlatformSuperAdmin admin = superAdminRepository.findByUserId(user.id);
        assertNotNull(admin);
        assertEquals(PlatformAdminStatus.ACTIVE, admin.status);
        assertTrue(Boolean.TRUE.equals(admin.mustChangePassword));
        assertTrue(Boolean.TRUE.equals(admin.twoFactorRequired));
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "PLATFORM_ADMIN_BOOTSTRAPPED"));

        PlatformBootstrapService.BootstrapResult second = bootstrapService.runBootstrap(List.of(email));
        assertFalse(second.ran);
        assertEquals("ACTIVE_SUPER_ADMIN_EXISTS", second.skippedReason);
        assertEquals(1L, PlatformSuperAdmin.count("userId", user.id));
        assertEquals(1L, User.count("email", email));
    }

    @Test
    @DisplayName("SOL-01 1.2.2: admin INVITED đăng nhập lần đầu chuyển ACTIVE với must_change_password")
    public void testInvitedAdminLoginActivates() throws Exception {
        String email = PlatformTestSupport.PREFIX + "invited@example.com";
        PlatformSuperAdmin admin = io.quarkus.narayana.jta.QuarkusTransaction.requiringNew().call(() ->
            PlatformTestSupport.createPlatformAdmin(email, PlatformAdminRole.SUPER_ADMIN,
                PlatformAdminStatus.INVITED, passwordHashService));
        io.quarkus.narayana.jta.QuarkusTransaction.requiringNew().run(() -> {
            PlatformSuperAdmin managed = superAdminRepository.find("id", admin.id).firstResult();
            managed.mustChangePassword = true;
            managed.persist();
        });

        String token = login(email, PlatformTestSupport.PASSWORD)
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.AUTH_LOGIN_SUCCESS))
            .extract().path("data.access_token");

        JsonWebToken jwt = jwtParser.parse(token);
        Object mustChange = jwt.getClaim("must_change_password");
        assertEquals("true", String.valueOf(mustChange).toLowerCase());

        PlatformAdminStatus reloaded = io.quarkus.narayana.jta.QuarkusTransaction.requiringNew().call(() ->
            superAdminRepository.findByUserId(admin.userId).status);
        assertEquals(PlatformAdminStatus.ACTIVE, reloaded);
    }

    @Test
    @DisplayName("TASK-274: admin DISABLED không thể đăng nhập")
    public void testDisabledAdminCannotLogin() {
        String email = PlatformTestSupport.PREFIX + "disabled-admin@example.com";
        io.quarkus.narayana.jta.QuarkusTransaction.requiringNew().run(() ->
            PlatformTestSupport.createPlatformAdmin(email, PlatformAdminRole.SUPER_ADMIN,
                PlatformAdminStatus.DISABLED, passwordHashService));

        login(email, PlatformTestSupport.PASSWORD)
            .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.AUTH_INVALID_CREDENTIALS));
    }
}
