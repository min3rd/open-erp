package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-294 / SOL-01 1.2.2: a platform admin flagged {@code must_change_password}
 * cannot use the portal (fail-closed), while a normal admin token keeps working.
 * The self-service release path is covered end-to-end by
 * {@link PlatformPasswordChangeFlowTest}.
 */
@QuarkusTest
public class PlatformPasswordChangeGuardTest {

    private static final String TENANTS_PATH = "/api/v1/platform/tenants";

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    public void setUp() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
    }

    @Test
    @DisplayName("TASK-294: must_change_password=true bị chặn 403 PLATFORM_PASSWORD_CHANGE_REQUIRED")
    public void testMustChangePasswordBlocksPortal() {
        String email = PlatformTestSupport.PREFIX + "mustchange@example.com";
        createAdmin(email, true);
        String token = login(email);

        given().header("Authorization", "Bearer " + token)
            .when().get(TENANTS_PATH)
            .then()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo(PlatformErrorCode.PLATFORM_PASSWORD_CHANGE_REQUIRED));
    }

    @Test
    @DisplayName("TASK-294: must_change_password=false truy cập portal bình thường")
    public void testAdminWithoutFlagCanUsePortal() {
        String email = PlatformTestSupport.PREFIX + "donechange@example.com";
        createAdmin(email, false);
        String token = login(email);

        given().header("Authorization", "Bearer " + token)
            .when().get(TENANTS_PATH)
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_TENANT_LIST_SUCCESS));
    }

    private void createAdmin(String email, boolean mustChangePassword) {
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformSuperAdmin admin = PlatformTestSupport.createPlatformAdmin(
                email, PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
            admin.mustChangePassword = mustChangePassword;
            admin.persist();
        });
    }

    private String login(String email) {
        return given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", PlatformTestSupport.PASSWORD))
            .when().post("/api/v1/auth/login")
            .then().statusCode(200)
            .extract().path("data.access_token");
    }
}
