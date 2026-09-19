package com.vn9melody.openerp.modules.organization.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.model.Department;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
@TestProfile(com.vn9melody.openerp.support.S2IamTestProfile.class)
public class TenantIsolationOrgTest {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    private Tenant tenantA;
    private Person adminA;
    private Branch branchB;
    private Department departmentB;
    private Person userB;
    private String bearerA;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        tenantA = S2IamFixtures.createTenant("iso-a");
        adminA = S2IamFixtures.createUser(tenantA.id, "s2iam.iso.a@example.com", "Admin A");

        Tenant tenantB = S2IamFixtures.createTenant("iso-b");
        userB = S2IamFixtures.createUser(tenantB.id, "s2iam.iso.b@example.com", "User B");
        branchB = S2IamFixtures.createBranch(tenantB.id, "ISO-B", "Chi nhánh B");
        departmentB = S2IamFixtures.createDepartment(tenantB.id, branchB.id, null, "ISO-B");

        bearerA = S2IamFixtures.bearer(jwtTokenService, sessionManager, adminA, "TENANT_ADMIN");
    }

    @Test
    @DisplayName("S2IAM-ISO-01: Tenant A không đọc/sửa/xóa được chi nhánh của Tenant B (404)")
    public void branchCrossTenantHidden() {
        given()
            .header("Authorization", bearerA)
        .when()
            .get("/api/v1/organization/branches/" + branchB.id)
        .then()
            .statusCode(404)
            .body("code", equalTo("ORGANIZATION_BRANCH_NOT_FOUND"));

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-X", "name", "Không được sửa"))
        .when()
            .patch("/api/v1/organization/branches/" + branchB.id)
        .then()
            .statusCode(404)
            .body("code", equalTo("ORGANIZATION_BRANCH_NOT_FOUND"));

        given()
            .header("Authorization", bearerA)
        .when()
            .delete("/api/v1/organization/branches/" + branchB.id)
        .then()
            .statusCode(404)
            .body("code", equalTo("ORGANIZATION_BRANCH_NOT_FOUND"));
    }

    @Test
    @DisplayName("S2IAM-ISO-02: Danh sách branches/memberships của Tenant A không rò rỉ dữ liệu Tenant B")
    public void listDoesNotLeak() {
        given()
            .header("Authorization", bearerA)
        .when()
            .get("/api/v1/organization/branches")
        .then()
            .statusCode(200)
            .body("data.items.id", not(org.hamcrest.Matchers.hasItem(branchB.id.toString())));

        given()
            .header("Authorization", bearerA)
        .when()
            .get("/api/v1/organization/memberships?user_id=" + userB.userId())
        .then()
            .statusCode(200)
            .body("data.items.size()", equalTo(0));
    }

    @Test
    @DisplayName("S2IAM-ISO-03: Tham chiếu user/branch/manager thuộc tenant khác bị chặn CROSS_TENANT_REFERENCE")
    public void crossTenantReferencesBlocked() {
        Map<String, Object> membership = new HashMap<>();
        membership.put("user_id", userB.userId().toString());
        membership.put("branch_id", branchB.id.toString());
        membership.put("department_id", departmentB.id.toString());
        membership.put("is_primary", true);

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(membership)
        .when()
            .post("/api/v1/organization/memberships")
        .then()
            .statusCode(400)
            .body("code", equalTo("ORGANIZATION_CROSS_TENANT_REFERENCE"));

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "X1", "name", "Phòng X", "branch_id", branchB.id.toString()))
        .when()
            .post("/api/v1/organization/departments")
        .then()
            .statusCode(400)
            .body("code", equalTo("ORGANIZATION_CROSS_TENANT_REFERENCE"));

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("user_id", userB.userId().toString(), "branch_id", branchB.id.toString(),
                "is_primary", true, "can_manage", true))
        .when()
            .post("/api/v1/organization/branch-assignments")
        .then()
            .statusCode(400)
            .body("code", equalTo("ORGANIZATION_CROSS_TENANT_REFERENCE"));
    }
}
