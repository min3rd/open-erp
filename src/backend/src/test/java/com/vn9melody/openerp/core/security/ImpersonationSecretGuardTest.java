package com.vn9melody.openerp.core.security;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.modules.platform.service.PlatformJwtService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BUG-68 / BR-SA-04: while impersonating, secret/export endpoints are rejected with
 * {@code 403 SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN}; the same endpoints stay
 * available to a normal tenant token that holds the permission.
 */
@QuarkusTest
public class ImpersonationSecretGuardTest {

    private static final String EXPORT_PATH = "/api/v1/core/sample-records/export";
    private static final String CHANGE_PASSWORD_PATH = "/api/v1/account/change-password";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    PlatformJwtService platformJwtService;

    @Inject
    SecurityContextService securityContextService;

    @Inject
    EntityManager em;

    private UUID tenantId;
    private UUID userId;
    private String normalToken;
    private String impersonationToken;

    @BeforeEach
    @Transactional
    public void setUp() {
        String suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        userId = S2EngineFixtures.insertUser(em, "imp-" + suffix);

        UUID roleId = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-exp");
        S2EngineFixtures.grantPermission(em, roleId, "core:sample-record:read");
        S2EngineFixtures.grantPermission(em, roleId, "core:sample-record:export");
        S2EngineFixtures.assignRole(em, userId, tenantId, roleId);
        S2EngineFixtures.upsertPolicy(em, tenantId, roleId, "CORE_SAMPLE_RECORD",
            DataScope.ALL, DataScope.ALL, DataScope.NONE, DataScope.NONE, DataScope.ALL, DataScope.NONE);
        securityContextService.invalidate(tenantId, userId);

        normalToken = jwtTokenService.generateAccessToken(
            userId, S2EngineFixtures.PREFIX + "imp-" + suffix + "@example.com", tenantId, "TENANT_ADMIN",
            UUID.randomUUID().toString());

        impersonationToken = platformJwtService.generateImpersonationToken(
            userId, S2EngineFixtures.PREFIX + "imp-" + suffix + "@example.com", tenantId, "TENANT_ADMIN",
            UUID.randomUUID(), "s2plat-super@example.com", UUID.randomUUID(), "SUPPORT-1",
            UUID.randomUUID().toString());
    }

    @Test
    @DisplayName("BUG-68: token thường có quyền export tải dữ liệu bình thường")
    public void testNormalTokenCanExport() {
        given()
            .header("Authorization", "Bearer " + normalToken)
            .contentType(ContentType.JSON)
        .when()
            .post(EXPORT_PATH + "?format=csv")
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.CORE_SAMPLE_RECORD_EXPORTED));
    }

    @Test
    @DisplayName("BUG-68: token impersonation bị chặn export với 403 SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN")
    public void testImpersonationTokenCannotExport() {
        io.restassured.response.Response response = given()
            .header("Authorization", "Bearer " + impersonationToken)
            .contentType(ContentType.JSON)
        .when()
            .post(EXPORT_PATH + "?format=csv")
        .then()
            .statusCode(403)
        .extract().response();

        assertTrue(response.asString().contains(ErrorCode.SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN),
            "Expected blocked export code in body: " + response.asString());
    }

    @Test
    @DisplayName("BUG-68: token impersonation bị chặn cả endpoint mang bí mật 2FA/mật khẩu")
    public void testImpersonationTokenCannotTouchSecrets() {
        given()
            .header("Authorization", "Bearer " + impersonationToken)
            .contentType(ContentType.JSON)
            .body(Map.of("current_password", "x", "new_password", "y"))
        .when()
            .post(CHANGE_PASSWORD_PATH)
        .then()
            .statusCode(403)
            .body("code", equalTo(ErrorCode.SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN));
    }
}
