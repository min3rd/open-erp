package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.JwtTokenService;
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
 * Sprint 04 / TASK-357: tenant UI theme preference API on real PostgreSQL.
 * Verifies defaults, update, validation and cross-tenant isolation.
 */
@QuarkusTest
public class TenantUiPreferencesApiTest {

    private static final String PATH = "/api/v1/tenant/ui-preferences";
    private static final String PERMISSION = "core:tenant:settings-manage";

    @Inject
    EntityManager em;

    @Inject
    SecurityContextService securityContextService;

    @Inject
    JwtTokenService jwtTokenService;

    private UUID tenantId;
    private String token;
    private String otherToken;

    @BeforeEach
    @Transactional
    public void setUp() {
        String suffix = S2EngineFixtures.suffix();
        insertPermission();

        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        UUID userId = S2EngineFixtures.insertUser(em, "uip-" + suffix);
        UUID roleId = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-uip");
        S2EngineFixtures.grantPermission(em, roleId, PERMISSION);
        S2EngineFixtures.assignRole(em, userId, tenantId, roleId);
        securityContextService.invalidate(tenantId, userId);
        token = tokenFor(userId, tenantId, "uip-" + suffix);

        UUID otherTenantId = S2EngineFixtures.insertTenant(em, suffix + "-b");
        UUID otherUserId = S2EngineFixtures.insertUser(em, "uipb-" + suffix);
        UUID otherRoleId = S2EngineFixtures.insertCustomRole(em, otherTenantId, suffix + "-uipb");
        S2EngineFixtures.grantPermission(em, otherRoleId, PERMISSION);
        S2EngineFixtures.assignRole(em, otherUserId, otherTenantId, otherRoleId);
        securityContextService.invalidate(otherTenantId, otherUserId);
        otherToken = tokenFor(otherUserId, otherTenantId, "uipb-" + suffix);
    }

    @Test
    @DisplayName("TASK-357: GET trả theme mặc định 'industrial' + danh mục 4 theme")
    public void testFetchDefaults() {
        given().header("Authorization", "Bearer " + token)
                .get(PATH)
                .then()
                .statusCode(200)
                .body("code", equalTo(ErrorCode.TENANT_UI_PREFERENCES_FETCH_SUCCESS))
                .body("data.theme", equalTo("industrial"))
                .body("data.available_themes", hasSize(4));
    }

    @Test
    @DisplayName("TASK-357: PUT đổi theme rồi GET thấy đã lưu")
    public void testUpdateAndPersist() {
        given().header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "emerald"))
                .put(PATH)
                .then()
                .statusCode(200)
                .body("code", equalTo(ErrorCode.TENANT_UI_PREFERENCES_UPDATE_SUCCESS))
                .body("data.theme", equalTo("emerald"));

        given().header("Authorization", "Bearer " + token)
                .get(PATH)
                .then()
                .statusCode(200)
                .body("data.theme", equalTo("emerald"));
    }

    @Test
    @DisplayName("TASK-357: theme không hợp lệ -> 400")
    public void testRejectsUnknownTheme() {
        given().header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "neon-pink"))
                .put(PATH)
                .then()
                .statusCode(400)
                .body("success", equalTo(false))
                .body("code", equalTo(ErrorCode.TENANT_UI_PREFERENCES_INVALID_THEME));
    }

    @Test
    @DisplayName("TASK-357: theme theo tenant, không rò rỉ chéo")
    public void testTenantIsolation() {
        given().header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "emerald"))
                .put(PATH)
                .then().statusCode(200);

        given().header("Authorization", "Bearer " + otherToken)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "slate-blue"))
                .put(PATH)
                .then().statusCode(200)
                .body("data.theme", equalTo("slate-blue"));

        given().header("Authorization", "Bearer " + token)
                .get(PATH)
                .then().statusCode(200)
                .body("data.theme", equalTo("emerald"));
    }

    private String tokenFor(UUID userId, UUID tenantId, String name) {
        return jwtTokenService.generateAccessToken(userId, S2EngineFixtures.PREFIX + name + "@example.com",
                tenantId, "TENANT_ADMIN", UUID.randomUUID().toString());
    }

    private void insertPermission() {
        em.createNativeQuery("""
                INSERT INTO permissions (code, domain, resource, action, description_key, is_system)
                VALUES ('core:tenant:settings-manage', 'core', 'tenant', 'settings-manage',
                        'PERM_CORE_TENANT_SETTINGS_MANAGE', FALSE)
                ON CONFLICT (code) DO UPDATE SET is_system = FALSE
                """).executeUpdate();
    }
}
