package com.vn9melody.openerp.modules.iam.resource;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** TASK-431: Core governance check for employee offboarding. */
@QuarkusTest
public class InternalEmployeeGovernanceResourceTest {

    @Inject
    EntityManager em;

    @Inject
    JwtTokenService jwtTokenService;

    private String suffix;
    private UUID tenantId;
    private String serviceToken;

    @BeforeEach
    void setup() {
        suffix = S2EngineFixtures.suffix();
        QuarkusTransaction.requiringNew().run(() -> tenantId = S2EngineFixtures.insertTenant(em, suffix));
        serviceToken = jwtTokenService.generatePluginServiceToken(tenantId, "employee", "TENANT",
            Duration.ofMinutes(5));
    }

    @Test
    @DisplayName("TASK-431: last owner is blocked; a second owner is allowed")
    void lastOwnerGuard() {
        UUID owner = QuarkusTransaction.requiringNew().call(() -> {
            UUID id = S2EngineFixtures.insertUser(em, "gov-owner-" + suffix);
            S2EngineFixtures.insertUserTenant(em, id, tenantId, "OWNER");
            S2EngineFixtures.assignRole(em, id, tenantId,
                S2EngineFixtures.systemRoleId(em, "TENANT_OWNER"));
            return id;
        });

        Response first = check(owner);
        Assertions.assertTrue(first.jsonPath().getBoolean("data.last_owner"));
        Assertions.assertFalse(first.jsonPath().getBoolean("data.last_admin"));
        Assertions.assertFalse(first.jsonPath().getBoolean("data.platform_role"));

        QuarkusTransaction.requiringNew().run(() -> {
            UUID second = S2EngineFixtures.insertUser(em, "gov-owner2-" + suffix);
            S2EngineFixtures.insertUserTenant(em, second, tenantId, "OWNER");
            S2EngineFixtures.assignRole(em, second, tenantId,
                S2EngineFixtures.systemRoleId(em, "TENANT_OWNER"));
        });

        Assertions.assertFalse(check(owner).jsonPath().getBoolean("data.last_owner"));
    }

    @Test
    @DisplayName("TASK-431: last tenant admin is blocked")
    void lastAdminGuard() {
        UUID admin = QuarkusTransaction.requiringNew().call(() -> {
            UUID id = S2EngineFixtures.insertUser(em, "gov-admin-" + suffix);
            S2EngineFixtures.insertUserTenant(em, id, tenantId, "TENANT_ADMIN");
            S2EngineFixtures.assignRole(em, id, tenantId,
                S2EngineFixtures.systemRoleId(em, "TENANT_ADMIN"));
            return id;
        });

        Response response = check(admin);
        Assertions.assertTrue(response.jsonPath().getBoolean("data.last_admin"));
        Assertions.assertFalse(response.jsonPath().getBoolean("data.last_owner"));
    }

    @Test
    @DisplayName("TASK-431: platform administrator is reported")
    void platformRoleGuard() {
        UUID admin = QuarkusTransaction.requiringNew().call(() -> {
            UUID id = S2EngineFixtures.insertUser(em, "gov-platform-" + suffix);
            S2EngineFixtures.insertUserTenant(em, id, tenantId, "MEMBER");
            em.createNativeQuery("""
                    INSERT INTO platform_super_admins
                        (user_id, role, is_active, status, must_change_password, two_factor_required)
                    VALUES (?1, 'SUPER_ADMIN', TRUE, 'ACTIVE', FALSE, FALSE)
                    """)
                .setParameter(1, id)
                .executeUpdate();
            return id;
        });

        Response response = check(admin);
        Assertions.assertTrue(response.jsonPath().getBoolean("data.platform_role"));
        Assertions.assertTrue(response.jsonPath().getList("data.platform_roles").contains("SUPER_ADMIN"));
    }

    @Test
    @DisplayName("TASK-431: user outside the service-token tenant is rejected")
    void tenantMismatch() {
        UUID foreignUser = QuarkusTransaction.requiringNew().call(() -> {
            UUID foreignTenant = S2EngineFixtures.insertTenant(em, "gov-other-" + suffix);
            UUID id = S2EngineFixtures.insertUser(em, "gov-foreign-" + suffix);
            S2EngineFixtures.insertUserTenant(em, id, foreignTenant, "MEMBER");
            return id;
        });

        RestAssured.given()
            .header("X-Plugin-Service-Token", serviceToken)
            .get("/api/v1/internal/employees/" + foreignUser + "/offboarding-check")
            .then()
            .statusCode(404);
    }

    private Response check(UUID userId) {
        return RestAssured.given()
            .header("X-Plugin-Service-Token", serviceToken)
            .get("/api/v1/internal/employees/" + userId + "/offboarding-check")
            .then()
            .statusCode(200)
            .extract().response();
    }
}
