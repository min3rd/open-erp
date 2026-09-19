package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.support.RedisTestSupport;
import com.vn9melody.openerp.support.TestDbCleanup;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-267 Wave 3: tenant access tokens carry the resolved {@code permissions}
 * claim so the frontend guard can read it; login and refresh both populate it.
 */
@QuarkusTest
public class PermissionsClaimApiTest {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    @BeforeEach
    @Transactional
    public void setUp() {
        TestDbCleanup.cleanup(entityManager);
        RedisTestSupport.clearAll(redis);
    }

    @Test
    @DisplayName("TASK-267: access token login/refresh có claim permissions chứa quyền của vai trò")
    public void testAccessTokenCarriesPermissions() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "pclaim." + suffix + "@example.com";
        String slug = "pclaim-" + suffix;

        given().contentType(ContentType.JSON)
            .body(Map.of(
                "admin", Map.of("full_name", "Permission Claim", "email", email,
                    "password", "PClaimP@ssw0rd123"),
                "tenant", Map.of("name", "Permission Claim " + suffix, "slug", slug)))
        .when()
            .post("/api/v1/auth/register/business")
        .then()
            .statusCode(201)
            .body("code", equalTo("AUTH_BUSINESS_REGISTER_SUCCESS"));

        Response login = given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", "PClaimP@ssw0rd123"))
        .when()
            .post("/api/v1/auth/login")
        .then()
            .statusCode(200)
            .body("code", equalTo("AUTH_LOGIN_SUCCESS"))
        .extract().response();

        assertPermissionsClaim(login.path("data.access_token"));

        String refreshed = given().contentType(ContentType.JSON)
            .body(Map.of("refresh_token", login.path("data.refresh_token")))
        .when()
            .post("/api/v1/auth/refresh")
        .then()
            .statusCode(200)
            .body("code", equalTo("AUTH_TOKEN_REFRESH_SUCCESS"))
        .extract().path("data.access_token");

        assertPermissionsClaim(refreshed);
    }

    private void assertPermissionsClaim(String accessToken) {
        try {
            JsonWebToken jwt = jwtTokenService.parseToken(accessToken);
            Object permissions = jwt.getClaim("permissions");
            assertNotNull(permissions, "permissions claim must be present");
            assertTrue(permissions.toString().contains("core:role:manage"),
                "permissions claim must contain the TENANT_ADMIN permissions but was: " + permissions);
        } catch (Exception e) {
            throw new AssertionError("Could not parse access token", e);
        }
    }
}
