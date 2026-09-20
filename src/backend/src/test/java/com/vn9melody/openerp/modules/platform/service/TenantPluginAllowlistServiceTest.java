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
 * TASK-270 + TASK-306: plugin availability enforcement. Sprint 03 reads the
 * {@code tenant_plugins} ledger (status ACTIVE); core modules are always
 * available (Gate Q4). Exercised on real PostgreSQL and Redis.
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
    @DisplayName("TASK-306: core luôn khả dụng; plugin tùy chọn cần ledger ACTIVE")
    public void testLedgerBasedAllowlist() {
        assertTrue(allowlistService.isAllowed(tenantId, "core"));
        assertDoesNotThrow(() -> allowlistService.assertAllowed(tenantId, "core"));

        assertFalse(allowlistService.isAllowed(tenantId, "sales"));
        ApiException exception = Assertions.assertThrows(ApiException.class,
            () -> allowlistService.assertAllowed(tenantId, "sales"));
        Assertions.assertEquals(403, exception.getStatusCode());
        Assertions.assertEquals(PlatformErrorCode.PLATFORM_PLUGIN_NOT_ALLOWED, exception.getErrorCode());
        Assertions.assertEquals("sales", exception.getParams().get("plugin"));

        upsertPluginInstall("sales", "ACTIVE");
        assertTrue(allowlistService.isAllowed(tenantId, "sales"));
        assertDoesNotThrow(() -> allowlistService.assertAllowed(tenantId, "sales"));

        upsertPluginInstall("sales", "INACTIVE");
        assertFalse(allowlistService.isAllowed(tenantId, "sales"));
    }

    @Test
    @DisplayName("TASK-306: core tách riêng khỏi allowed_plugins (Gate Q4) — hook vẫn cho phép core")
    public void testCoreAlwaysAvailable() {
        updateAllowedPlugins("[]");

        given()
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(Map.of("title", "s3-plugin-core-ok", "amount", 10))
        .when()
            .post(SAMPLE_RECORDS_PATH)
        .then()
            .statusCode(201)
            .body("code", equalTo("CORE_SAMPLE_RECORD_CREATED"));

        updateAllowedPlugins("[\"core\"]");
    }

    private void upsertPluginInstall(String pluginKey, String status) {
        QuarkusTransaction.requiringNew().run(() -> {
            Object catalogId = em.createNativeQuery("""
                    INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility)
                    VALUES (?1, ?2, ?3, 'PLATFORM')
                    ON CONFLICT (plugin_key) DO UPDATE SET updated_at = NOW()
                    RETURNING id
                    """)
                .setParameter(1, pluginKey)
                .setParameter(2, "PLUGIN_" + pluginKey.toUpperCase() + "_NAME")
                .setParameter(3, "PLUGIN_" + pluginKey.toUpperCase() + "_DESCRIPTION")
                .getSingleResult();
            em.createNativeQuery("""
                    INSERT INTO tenant_plugins (tenant_id, catalog_id, plugin_key, status)
                    VALUES (?1, ?2, ?3, ?4)
                    ON CONFLICT (tenant_id, plugin_key) DO UPDATE SET status = EXCLUDED.status
                    """)
                .setParameter(1, tenantId)
                .setParameter(2, catalogId)
                .setParameter(3, pluginKey)
                .setParameter(4, status)
                .executeUpdate();
        });
    }

    private void updateAllowedPlugins(String json) {
        QuarkusTransaction.requiringNew().run(() -> em.createNativeQuery(
                "UPDATE tenants SET allowed_plugins = CAST(?1 AS jsonb) WHERE id = ?2")
            .setParameter(1, json)
            .setParameter(2, tenantId)
            .executeUpdate());
    }
}
