package com.vn9melody.openerp.core.audit;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.support.AuditEnabledTestProfile;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
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
 * TASK-267/291: tenant-scope audit wiring through the {@code AuditRecorder} bridge.
 * Runs with {@code openerp.platform.audit.recorder-enabled=true} to assert DENIED
 * permission events and SUCCESS org/iam write events are persisted (hash-chained).
 */
@QuarkusTest
@TestProfile(AuditEnabledTestProfile.class)
public class AuditWiringTest {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    @Inject
    EntityManager em;

    private Tenant tenant;
    private String adminBearer;
    private String staffBearer;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        tenant = S2IamFixtures.createTenant("audit");
        Person admin = S2IamFixtures.createUser(tenant.id, "s2iam.audit.admin@example.com", "Audit Admin");
        Person staff = S2IamFixtures.createUser(tenant.id, "s2iam.audit.staff@example.com", "Audit Staff");
        adminBearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
        staffBearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, staff, "STAFF");
    }

    @Test
    @DisplayName("TASK-267: thiếu quyền sinh audit DENIED IAM_PERMISSION_DENIED trong platform_audit_logs")
    public void testDeniedPermissionIsAudited() {
        given()
            .header("Authorization", staffBearer)
        .when()
            .get("/api/v1/iam/roles")
        .then()
            .statusCode(403)
            .body("code", equalTo(ErrorCode.IAM_PERMISSION_DENIED_FUNCTIONAL));

        assertEquals(1L, countAudit("IAM_PERMISSION_DENIED", "DENIED"));
    }

    @Test
    @DisplayName("TASK-291: ghi branch thành công sinh audit TENANT scope ORG_BRANCH_CREATE")
    public void testOrgWriteIsAudited() {
        given()
            .header("Authorization", adminBearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-AUD", "name", "Audit Branch"))
        .when()
            .post("/api/v1/organization/branches")
        .then()
            .statusCode(201)
            .body("code", equalTo("ORGANIZATION_BRANCH_CREATED_SUCCESS"));

        assertEquals(1L, countAudit("ORG_BRANCH_CREATE", "SUCCESS"));
    }

    @Test
    @DisplayName("TASK-291: cập nhật quyền vai trò sinh audit IAM_ROLE_PERMISSION_UPDATE")
    public void testRolePermissionUpdateIsAudited() {
        UUID roleId = S2IamFixtures.createCustomRoleTx(tenant.id, "AUDITROLE", "Audit Role").id;

        given()
            .header("Authorization", adminBearer)
            .contentType(ContentType.JSON)
            .body(Map.of("permission_ids", java.util.List.of("core:role:read")))
        .when()
            .put("/api/v1/iam/roles/" + roleId + "/permissions")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_PERMISSIONS_UPDATED"));

        assertEquals(1L, countAudit("IAM_ROLE_PERMISSION_UPDATE", "SUCCESS"));
    }

    private long countAudit(String action, String result) {
        Object count = em.createNativeQuery(
                "SELECT count(*) FROM platform_audit_logs WHERE tenant_id = :tenantId "
                    + "AND action = :action AND result = :result")
            .setParameter("tenantId", tenant.id)
            .setParameter("action", action)
            .setParameter("result", result)
            .getSingleResult();
        return count != null ? ((Number) count).longValue() : 0L;
    }
}
