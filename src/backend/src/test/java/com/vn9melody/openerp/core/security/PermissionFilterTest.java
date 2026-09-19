package com.vn9melody.openerp.core.security;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.smallrye.jwt.build.Jwt;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-267: {@code @RequirePermission} enforcement via ContainerRequestFilter:
 * 403 IAM_PERMISSION_DENIED_FUNCTIONAL + params, default-allow for endpoints
 * without the annotation and explicit platform-token bypass.
 */
@QuarkusTest
public class PermissionFilterTest {

    private static final String LIST_PATH = "/api/v1/core/sample-records";
    private static final String PROFILE_PATH = "/api/v1/account/profile";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SecurityContextService securityContextService;

    @Inject
    EntityManager em;

    private UUID tenantId;
    private UUID readOnlyUserId;
    private UUID fullUserId;
    private String readOnlyToken;
    private String fullToken;

    @BeforeEach
    @Transactional
    public void setup() {
        String suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        readOnlyUserId = S2EngineFixtures.insertUser(em, "ro-" + suffix);
        fullUserId = S2EngineFixtures.insertUser(em, "full-" + suffix);

        UUID readRole = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-ro");
        S2EngineFixtures.grantPermission(em, readRole, "core:sample-record:read");
        S2EngineFixtures.assignRole(em, readOnlyUserId, tenantId, readRole);
        S2EngineFixtures.upsertPolicy(em, tenantId, readRole, "CORE_SAMPLE_RECORD",
            DataScope.OWN_ONLY, DataScope.ALL, DataScope.NONE, DataScope.NONE, DataScope.NONE, DataScope.NONE);

        UUID fullRole = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-full");
        S2EngineFixtures.grantPermission(em, fullRole, "core:sample-record:read");
        S2EngineFixtures.grantPermission(em, fullRole, "core:sample-record:create");
        S2EngineFixtures.assignRole(em, fullUserId, tenantId, fullRole);
        S2EngineFixtures.upsertPolicy(em, tenantId, fullRole, "CORE_SAMPLE_RECORD",
            DataScope.OWN_ONLY, DataScope.OWN_ONLY, DataScope.NONE, DataScope.NONE, DataScope.NONE, DataScope.NONE);

        readOnlyToken = mintToken(readOnlyUserId, suffix + "-ro");
        fullToken = mintToken(fullUserId, suffix + "-full");
        securityContextService.invalidate(tenantId, readOnlyUserId);
        securityContextService.invalidate(tenantId, fullUserId);
    }

    @Test
    @DisplayName("TASK-267: thiếu quyền chức năng trả 403 IAM_PERMISSION_DENIED_FUNCTIONAL kèm params")
    public void testMissingFunctionalPermission() {
        given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + readOnlyToken)
            .body(Map.of("title", "s2eng-denied", "amount", 10))
        .when()
            .post(LIST_PATH)
        .then()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.IAM_PERMISSION_DENIED_FUNCTIONAL))
            .body("params.permission", equalTo("core:sample-record:create"))
            .body("params.required_permission", equalTo("core:sample-record:create"));
    }

    @Test
    @DisplayName("TASK-267: đủ quyền chức năng thì request đi qua bình thường")
    public void testSufficientFunctionalPermission() {
        given()
            .header("Authorization", "Bearer " + fullToken)
        .when()
            .get(LIST_PATH)
        .then()
            .statusCode(200)
            .body("success", equalTo(true))
            .body("code", equalTo(ErrorCode.CORE_SAMPLE_RECORD_LIST_SUCCESS));
    }

    @Test
    @DisplayName("TASK-267: endpoint thiếu token trả 401 chuẩn hóa")
    public void testUnauthenticatedAnnotatedEndpoint() {
        given()
        .when()
            .get(LIST_PATH)
        .then()
            .statusCode(401)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("TASK-267: endpoint không gắn annotation vẫn default-allow (không bị chặn bởi filter)")
    public void testUnannotatedEndpointDefaultAllow() {
        given()
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(401)
            .body("code", equalTo(ErrorCode.UNAUTHORIZED))
            .body("code", not(equalTo(ErrorCode.IAM_PERMISSION_DENIED_FUNCTIONAL)));
    }

    @Test
    @DisplayName("TASK-267: token platform được bypass có log, không bị chặn bởi quyền chức năng tenant")
    public void testPlatformTokenBypass() {
        String platformToken = Jwt.issuer("https://openerp.9ms.io.vn/auth")
            .subject(fullUserId.toString())
            .claim("platform_role", "SUPER_ADMIN")
            .claim("scope", "PLATFORM")
            .expiresIn(Duration.ofMinutes(5))
            .sign();

        given()
            .header("Authorization", "Bearer " + platformToken)
        .when()
            .get(LIST_PATH)
        .then()
            .body("code", not(equalTo(ErrorCode.IAM_PERMISSION_DENIED_FUNCTIONAL)))
            .body("success", not(nullValue()));
    }

    private String mintToken(UUID userId, String emailSuffix) {
        return jwtTokenService.generateAccessToken(
            userId, S2EngineFixtures.PREFIX + emailSuffix + "@example.com", tenantId, "STAFF",
            UUID.randomUUID().toString());
    }

    @SuppressWarnings("unused")
    private Map<String, Object> body(String title) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        return body;
    }
}
