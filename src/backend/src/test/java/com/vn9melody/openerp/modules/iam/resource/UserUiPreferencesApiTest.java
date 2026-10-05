package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.narayana.jta.QuarkusTransaction;
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
 * Sprint 04 / TASK-369: per-user UI preferences API on real PostgreSQL.
 * Verifies defaults, persistence, clearing, validation and per-user isolation.
 */
@QuarkusTest
public class UserUiPreferencesApiTest {

    private static final String PATH = "/api/v1/account/ui-preferences";

    @Inject
    EntityManager em;

    @Inject
    SecurityContextService securityContextService;

    @Inject
    JwtTokenService jwtTokenService;

    private UUID tenantId;
    private String tokenA;
    private String tokenB;
    private String otherToken;

    @BeforeEach
    @Transactional
    public void setUp() {
        String suffix = S2EngineFixtures.suffix();

        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        UUID userA = S2EngineFixtures.insertUser(em, "uip-" + suffix);
        UUID userB = S2EngineFixtures.insertUser(em, "uipb-" + suffix);
        securityContextService.invalidate(tenantId, userA);
        securityContextService.invalidate(tenantId, userB);
        tokenA = tokenFor(userA, tenantId, "uip-" + suffix);
        tokenB = tokenFor(userB, tenantId, "uipb-" + suffix);

        UUID otherTenantId = S2EngineFixtures.insertTenant(em, suffix + "-b");
        UUID otherUser = S2EngineFixtures.insertUser(em, "uipc-" + suffix);
        securityContextService.invalidate(otherTenantId, otherUser);
        otherToken = tokenFor(otherUser, otherTenantId, "uipc-" + suffix);
    }

    @Test
    @DisplayName("TASK-369: GET trả giá trị null + tenant_theme 'industrial' + danh mục hợp lệ")
    public void testFetchDefaults() {
        given().header("Authorization", "Bearer " + tokenA)
                .get(PATH)
                .then()
                .statusCode(200)
                .body("code", equalTo(ErrorCode.USER_UI_PREFERENCES_FETCH_SUCCESS))
                .body("data.theme", nullValue())
                .body("data.shape", nullValue())
                .body("data.layout", nullValue())
                .body("data.mode", nullValue())
                .body("data.tenant_theme", equalTo("industrial"))
                .body("data.available_themes", hasSize(4))
                .body("data.available_shapes", hasSize(3))
                .body("data.available_layouts", hasSize(4))
                .body("data.available_modes", hasSize(3));
    }

    @Test
    @DisplayName("TASK-369: PUT đủ 4 giá trị rồi GET thấy đã lưu")
    public void testUpdateAndPersist() {
        given().header("Authorization", "Bearer " + tokenA)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "amber", "shape", "rounded", "layout", "right", "mode", "DARK"))
                .put(PATH)
                .then()
                .statusCode(200)
                .body("code", equalTo(ErrorCode.USER_UI_PREFERENCES_UPDATE_SUCCESS))
                .body("data.theme", equalTo("amber"))
                .body("data.shape", equalTo("rounded"))
                .body("data.layout", equalTo("right"))
                .body("data.mode", equalTo("DARK"));

        given().header("Authorization", "Bearer " + tokenA)
                .get(PATH)
                .then()
                .statusCode(200)
                .body("data.theme", equalTo("amber"))
                .body("data.shape", equalTo("rounded"))
                .body("data.layout", equalTo("right"))
                .body("data.mode", equalTo("DARK"));
    }

    @Test
    @DisplayName("TASK-369: PUT toàn null xóa hết về null (theo tenant mặc định)")
    public void testUpdateWithNullsClears() {
        given().header("Authorization", "Bearer " + tokenA)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "emerald", "shape", "soft", "layout", "side", "mode", "LIGHT"))
                .put(PATH)
                .then().statusCode(200);

        given().header("Authorization", "Bearer " + tokenA)
                .contentType(ContentType.JSON)
                .body(Map.of())
                .put(PATH)
                .then()
                .statusCode(200)
                .body("data.theme", nullValue())
                .body("data.shape", nullValue())
                .body("data.layout", nullValue())
                .body("data.mode", nullValue());

        given().header("Authorization", "Bearer " + tokenA)
                .get(PATH)
                .then()
                .statusCode(200)
                .body("data.theme", nullValue())
                .body("data.shape", nullValue())
                .body("data.layout", nullValue())
                .body("data.mode", nullValue());
    }

    @Test
    @DisplayName("TASK-369: giá trị không hợp lệ -> 400 USER_UI_PREFERENCES_INVALID_VALUE")
    public void testRejectsInvalidValues() {
        given().header("Authorization", "Bearer " + tokenA)
                .contentType(ContentType.JSON)
                .body(Map.of("layout", "warp"))
                .put(PATH)
                .then()
                .statusCode(400)
                .body("success", equalTo(false))
                .body("code", equalTo(ErrorCode.USER_UI_PREFERENCES_INVALID_VALUE));

        given().header("Authorization", "Bearer " + tokenA)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "neon-pink"))
                .put(PATH)
                .then()
                .statusCode(400)
                .body("success", equalTo(false))
                .body("code", equalTo(ErrorCode.USER_UI_PREFERENCES_INVALID_VALUE));
    }

    @Test
    @DisplayName("TASK-369: hai user cùng tenant lưu riêng, cùng thấy tenant_theme")
    public void testUsersInSameTenantAreIsolated() {
        given().header("Authorization", "Bearer " + tokenA)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "amber"))
                .put(PATH)
                .then().statusCode(200)
                .body("data.theme", equalTo("amber"))
                .body("data.tenant_theme", equalTo("industrial"));

        given().header("Authorization", "Bearer " + tokenB)
                .get(PATH)
                .then()
                .statusCode(200)
                .body("data.theme", nullValue())
                .body("data.tenant_theme", equalTo("industrial"));
    }

    @Test
    @DisplayName("TASK-369: tenant_theme đổi theo tenant, theme của user vẫn null")
    public void testTenantDefaultIsReported() {
        QuarkusTransaction.requiringNew().run(() ->
                Tenant.getEntityManager().createNativeQuery("UPDATE tenants SET ui_theme = ?1 WHERE id = ?2")
                        .setParameter(1, "emerald")
                        .setParameter(2, tenantId)
                        .executeUpdate());

        given().header("Authorization", "Bearer " + tokenA)
                .get(PATH)
                .then()
                .statusCode(200)
                .body("data.theme", nullValue())
                .body("data.tenant_theme", equalTo("emerald"));
    }

    @Test
    @DisplayName("TASK-369: user tenant khác không bị ảnh hưởng")
    public void testCrossTenantIsolation() {
        given().header("Authorization", "Bearer " + tokenA)
                .contentType(ContentType.JSON)
                .body(Map.of("theme", "amber"))
                .put(PATH)
                .then().statusCode(200);

        given().header("Authorization", "Bearer " + otherToken)
                .get(PATH)
                .then()
                .statusCode(200)
                .body("data.theme", nullValue())
                .body("data.tenant_theme", equalTo("industrial"));
    }

    private String tokenFor(UUID userId, UUID tenantId, String name) {
        return jwtTokenService.generateAccessToken(userId, S2EngineFixtures.PREFIX + name + "@example.com",
                tenantId, "MEMBER", UUID.randomUUID().toString());
    }
}
