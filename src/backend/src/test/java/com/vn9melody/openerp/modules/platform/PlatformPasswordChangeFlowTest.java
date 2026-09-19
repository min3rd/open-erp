package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.oneOf;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Map;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-294 / BUG-77 end-to-end regression: a platform admin flagged
 * {@code must_change_password} must be able to change the password through the
 * shared self-service endpoint, and the successful change must clear the flag so
 * the portal is no longer locked in a {@code PLATFORM_PASSWORD_CHANGE_REQUIRED}
 * loop.
 */
@QuarkusTest
public class PlatformPasswordChangeFlowTest {

    private static final String TENANTS_PATH = "/api/v1/platform/tenants";
    private static final String CHANGE_PASSWORD_PATH = "/api/v1/account/change-password";
    private static final String PROFILE_PATH = "/api/v1/account/profile";
    private static final String SESSIONS_PATH = "/api/v1/account/sessions";
    private static final String NEW_PASSWORD = "S2PlatNewP@ssw0rd456";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Inject
    JWTParser jwtParser;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    public void setUp() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
    }

    @Test
    @DisplayName("TASK-294/BUG-77: đổi mật khẩu thành công mở khóa portal, hết vòng lặp must_change_password")
    public void testPasswordChangeReleasesPlatformAdmin() throws Exception {
        String email = PlatformTestSupport.PREFIX + "flow@example.com";
        PlatformSuperAdmin admin = QuarkusTransaction.requiringNew().call(() -> {
            PlatformSuperAdmin created = PlatformTestSupport.createPlatformAdmin(
                email, PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.INVITED, passwordHashService);
            created.mustChangePassword = true;
            created.persist();
            return created;
        });

        String initialToken = login(email, PlatformTestSupport.PASSWORD);
        JsonWebToken initialJwt = jwtParser.parse(initialToken);
        Object initialFlag = initialJwt.getClaim("must_change_password");
        assertEquals("true", String.valueOf(initialFlag).toLowerCase());

        // 1. Platform endpoints are blocked while the flag is set.
        given().header("Authorization", "Bearer " + initialToken)
            .when().get(TENANTS_PATH)
            .then()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo(PlatformErrorCode.PLATFORM_PASSWORD_CHANGE_REQUIRED));

        // 2. The account allowlist lets the change-password screen through...
        given().header("Authorization", "Bearer " + initialToken)
            .when().get(PROFILE_PATH)
            .then().statusCode(200);

        // ...but every other account endpoint stays fail-closed.
        given().header("Authorization", "Bearer " + initialToken)
            .when().get(SESSIONS_PATH)
            .then()
            .statusCode(403)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_PASSWORD_CHANGE_REQUIRED));

        // 3. Change the password with the confined token.
        given().header("Authorization", "Bearer " + initialToken)
            .contentType(ContentType.JSON)
            .body(Map.of(
                "current_password", PlatformTestSupport.PASSWORD,
                "new_password", NEW_PASSWORD,
                "logout_other_devices", false))
            .when().post(CHANGE_PASSWORD_PATH)
            .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.ACCOUNT_PASSWORD_CHANGE_SUCCESS));

        // 3b. BUG-76: the stale token must be rejected after the change (the forced
        // change revoked its session and the DB flag is already false).
        given().header("Authorization", "Bearer " + initialToken)
            .when().get(TENANTS_PATH)
            .then()
            .statusCode(oneOf(401, 403));

        // 4. The database flag is cleared and the admin is active.
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformSuperAdmin reloaded = superAdminRepository.findByUserId(admin.userId);
            assertFalse(Boolean.TRUE.equals(reloaded.mustChangePassword));
            assertEquals(PlatformAdminStatus.ACTIVE, reloaded.status);
        });

        // 5. A fresh login carries must_change_password=false...
        String newToken = login(email, NEW_PASSWORD);
        JsonWebToken newJwt = jwtParser.parse(newToken);
        Object newFlag = newJwt.getClaim("must_change_password");
        assertEquals("false", String.valueOf(newFlag).toLowerCase());

        // ...and the portal is reachable again (loop broken).
        given().header("Authorization", "Bearer " + newToken)
            .when().get(TENANTS_PATH)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_LIST_SUCCESS));
    }

    private String login(String email, String password) {
        return given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", password))
            .when().post("/api/v1/auth/login")
            .then().statusCode(200)
            .extract().path("data.access_token");
    }
}
