package com.vn9melody.openerp.modules.platform.service;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-270 / BUG-53: tenant plugin allowlist enforcement. The service is exercised
 * on real PostgreSQL and the reference entity endpoint demonstrates the hook
 * (plugin {@code core} denied when removed from {@code tenants.allowed_plugins}).
 */
@QuarkusTest
public class TenantPluginAllowlistServiceTest {

    private static final String SAMPLE_RECORDS_PATH = "/api/v1/core/sample-records";

    @Inject
    TenantPluginAllowlistService allowlistService;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SecurityContextService securityContextService;

    @Inject
    EntityManager em;

    private UUID tenantId;
    private String token;

    @BeforeEach
    @Transactional
    public void setUp() {
        String suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        UUID userId = S2EngineFixtures.insertUser(em, "plugin-" + suffix);
        UUID roleId = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-plugin");
        S2EngineFixtures.grantPermission(em, roleId, "core:sample-record:read");
        S2EngineFixtures.grantPermission(em, roleId, "core:sample-record:create");
        S2EngineFixtures.assignRole(em, userId, tenantId, roleId);
        S2EngineFixtures.upsertPolicy(em, tenantId, roleId, "CORE_SAMPLE_RECORD",
            DataScope.ALL, DataScope.ALL, DataScope.NONE, DataScope.NONE, DataScope.NONE, DataScope.NONE);
        securityContextService.invalidate(tenantId, userId);
        token = jwtTokenService.generateAccessToken(
            userId, S2EngineFixtures.PREFIX + "plugin-" + suffix + "@example.com", tenantId, "TENANT_ADMIN",
            UUID.randomUUID().toString());
    }

    @Test
    @DisplayName("TASK-270: default allowlist ['core'] cho phép core, chặn plugin khác")
    public void testAllowlistLookup() {
        assertTrue(allowlistService.isAllowed(tenantId, "core"));
        assertDoesNotThrow(() -> allowlistService.assertAllowed(tenantId, "core"));

        assertFalse(allowlistService.isAllowed(tenantId, "sales"));
        ApiException exception = Assertions.assertThrows(ApiException.class,
            () -> allowlistService.assertAllowed(tenantId, "sales"));
        Assertions.assertEquals(403, exception.getStatusCode());
        Assertions.assertEquals(PlatformErrorCode.PLATFORM_PLUGIN_NOT_ALLOWED, exception.getErrorCode());
        Assertions.assertEquals("sales", exception.getParams().get("plugin"));
    }

    @Test
    @DisplayName("TASK-270: hook tại SampleRecordService chặn khi plugin core bị gỡ khỏi allowlist")
    public void testPluginHookOnReferenceEntity() {
        given()
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(Map.of("title", "s2eng-plugin-ok", "amount", 10))
        .when()
            .post(SAMPLE_RECORDS_PATH)
        .then()
            .statusCode(201)
            .body("code", equalTo("CORE_SAMPLE_RECORD_CREATED"));

        updateAllowedPlugins("[]");

        given()
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(Map.of("title", "s2eng-plugin-denied", "amount", 10))
        .when()
            .post(SAMPLE_RECORDS_PATH)
        .then()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo(PlatformErrorCode.PLATFORM_PLUGIN_NOT_ALLOWED))
            .body("params.plugin", equalTo("core"));

        updateAllowedPlugins("[\"core\"]");
    }

    private void updateAllowedPlugins(String json) {
        QuarkusTransaction.requiringNew().run(() -> em.createNativeQuery(
                "UPDATE tenants SET allowed_plugins = CAST(?1 AS jsonb) WHERE id = ?2")
            .setParameter(1, json)
            .setParameter(2, tenantId)
            .executeUpdate());
    }
}
