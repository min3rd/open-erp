package com.vn9melody.openerp.modules.organization.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
@TestProfile(com.vn9melody.openerp.support.S2IamTestProfile.class)
public class BranchAssignmentApiTest {

    private static final String PATH = "/api/v1/organization/branch-assignments";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    private Tenant tenant;
    private Person admin;
    private Person manager;
    private Branch branchA;
    private Branch branchB;
    private String bearer;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        tenant = S2IamFixtures.createTenant("assign");
        admin = S2IamFixtures.createUser(tenant.id, "s2iam.assign.admin@example.com", "Assign Admin");
        manager = S2IamFixtures.createUser(tenant.id, "s2iam.assign.manager@example.com", "Regional Manager");
        branchA = S2IamFixtures.createBranch(tenant.id, "RA", "Chi nhánh RA");
        branchB = S2IamFixtures.createBranch(tenant.id, "RB", "Chi nhánh RB");
        bearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
    }

    @Test
    @DisplayName("S2IAM-BA-01: Tạo nhiều dòng phân công cho 1 user, is_primary duy nhất")
    public void createMultipleAssignmentsWithSinglePrimary() {
        Response created = given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of(
                "user_id", manager.userId().toString(),
                "branch_id", branchA.id.toString(),
                "is_primary", true,
                "can_manage", true))
        .when()
            .post(PATH)
        .then()
            .statusCode(201)
            .body("code", equalTo("ORGANIZATION_BRANCH_ASSIGNMENT_CREATED"))
            .body("data.is_primary", equalTo(true))
            .body("data.branch_code", equalTo("S2IAM-RA"))
        .extract().response();

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of(
                "user_id", manager.userId().toString(),
                "branch_id", branchB.id.toString(),
                "is_primary", true,
                "can_manage", true))
        .when()
            .post(PATH)
        .then()
            .statusCode(201)
            .body("data.is_primary", equalTo(true));

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "?user_id=" + manager.userId())
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_BRANCH_ASSIGNMENT_LIST_SUCCESS"))
            .body("data.items.size()", equalTo(2))
            .body("data.items.find { it.id == '" + created.path("data.id") + "' }.is_primary", equalTo(false))
            .body("data.items.find { it.branch_id == '" + branchB.id + "' }.is_primary", equalTo(true));
    }

    @Test
    @DisplayName("S2IAM-BA-02: Gán nhiều chi nhánh một lần qua mảng assignments")
    public void bulkAssignments() {
        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of(
                "user_id", manager.userId().toString(),
                "assignments", List.of(
                    Map.of("branch_id", branchA.id.toString(), "is_primary", false, "can_manage", true),
                    Map.of("branch_id", branchB.id.toString(), "is_primary", true, "can_manage", true))))
        .when()
            .post(PATH)
        .then()
            .statusCode(201)
            .body("data.is_primary", equalTo(true));

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "?user_id=" + manager.userId())
        .then()
            .statusCode(200)
            .body("data.items.size()", equalTo(2));
    }

    @Test
    @DisplayName("S2IAM-BA-03: PATCH is_primary tự bỏ primary cũ; cấm xóa primary cuối cùng")
    public void updatePrimaryAndDeleteGuard() {
        Response first = given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("user_id", manager.userId().toString(), "branch_id", branchA.id.toString(),
                "is_primary", true, "can_manage", true))
        .when()
            .post(PATH)
            .then()
            .statusCode(201)
        .extract().response();

        String secondId = given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("user_id", manager.userId().toString(), "branch_id", branchB.id.toString(),
                "is_primary", false, "can_manage", true))
        .when()
            .post(PATH)
            .then()
            .statusCode(201)
        .extract().path("data.id");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("is_primary", true, "can_manage", true))
        .when()
            .patch(PATH + "/" + secondId)
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_BRANCH_ASSIGNMENT_UPDATED"))
            .body("data.is_primary", equalTo(true));

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "?user_id=" + manager.userId())
        .then()
            .statusCode(200)
            .body("data.items.find { it.id == '" + first.path("data.id") + "' }.is_primary", equalTo(false));

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + first.path("data.id"))
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_BRANCH_ASSIGNMENT_REMOVED"));

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + secondId)
        .then()
            .statusCode(409)
            .body("code", equalTo("ORGANIZATION_PRIMARY_BRANCH_REQUIRED"));
    }

    @Test
    @DisplayName("S2IAM-BA-04: Chặn tạo trùng phân công user × branch")
    public void duplicateAssignmentBlocked() {
        S2IamFixtures.createBranchAssignmentTx(tenant.id, manager, branchA, true, true);

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("user_id", manager.userId().toString(), "branch_id", branchA.id.toString(),
                "is_primary", false, "can_manage", true))
        .when()
            .post(PATH)
        .then()
            .statusCode(409)
            .body("code", equalTo("ORGANIZATION_BRANCH_ASSIGNMENT_EXISTS"));
    }
}
