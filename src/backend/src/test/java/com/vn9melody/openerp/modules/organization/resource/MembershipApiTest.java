package com.vn9melody.openerp.modules.organization.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.model.Department;
import com.vn9melody.openerp.modules.organization.model.UserDepartmentMembership;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
@TestProfile(com.vn9melody.openerp.support.S2IamTestProfile.class)
public class MembershipApiTest {

    private static final String PATH = "/api/v1/organization/memberships";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    private Tenant tenant;
    private Person admin;
    private Person userA;
    private Person userB;
    private Branch branch;
    private Department deptA;
    private Department deptB;
    private String bearer;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        tenant = S2IamFixtures.createTenant("member");
        admin = S2IamFixtures.createUser(tenant.id, "s2iam.member.admin@example.com", "Member Admin");
        userA = S2IamFixtures.createUser(tenant.id, "s2iam.member.a@example.com", "User A");
        userB = S2IamFixtures.createUser(tenant.id, "s2iam.member.b@example.com", "User B");
        branch = S2IamFixtures.createBranch(tenant.id, "M", "Chi nhánh M");
        deptA = S2IamFixtures.createDepartment(tenant.id, branch.id, null, "MA");
        deptB = S2IamFixtures.createDepartment(tenant.id, branch.id, null, "MB");
        bearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
    }

    private Map<String, Object> body(Person person, Department department, String managerId, Boolean primary) {
        Map<String, Object> body = new HashMap<>();
        body.put("user_id", person.userId().toString());
        body.put("branch_id", branch.id.toString());
        body.put("department_id", department.id.toString());
        body.put("direct_manager_user_id", managerId);
        body.put("title", "Nhân viên");
        body.put("is_primary", primary);
        return body;
    }

    @Test
    @DisplayName("S2IAM-MB-01: Tạo membership, giữ bất biến duy nhất 1 primary khi đổi cờ")
    public void primaryInvariant() {
        Response first = given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(body(userA, deptA, null, true))
        .when()
            .post(PATH)
        .then()
            .statusCode(201)
            .body("code", equalTo("ORGANIZATION_MEMBERSHIP_CREATED"))
            .body("data.is_primary", equalTo(true))
        .extract().response();

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(body(userA, deptB, null, false))
        .when()
            .post(PATH)
        .then()
            .statusCode(201)
            .body("data.is_primary", equalTo(false));

        String secondId = UserDepartmentMembership
            .<UserDepartmentMembership>find("userId = ?1 and departmentId = ?2", userA.userId(), deptB.id)
            .firstResult().id.toString();

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(body(userA, deptB, null, true))
        .when()
            .patch(PATH + "/" + secondId)
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_MEMBERSHIP_UPDATED"))
            .body("data.is_primary", equalTo(true));

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "?user_id=" + userA.userId())
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_MEMBERSHIP_LIST_SUCCESS"))
            .body("data.items.size()", equalTo(2))
            .body("data.items.find { it.id == '" + first.path("data.id") + "' }.is_primary", equalTo(false));
    }

    @Test
    @DisplayName("S2IAM-MB-02: Không thể xóa membership primary cuối cùng của người dùng")
    public void deleteLastPrimaryBlocked() {
        UserDepartmentMembership membership = S2IamFixtures.createMembershipTx(
            tenant.id, userB, branch, deptA, null, true);

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + membership.id)
        .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("code", equalTo("ORGANIZATION_PRIMARY_REQUIRED"));
    }

    @Test
    @DisplayName("S2IAM-MB-03: Xóa primary khi còn membership khác sẽ tự thăng cấp primary mới")
    public void deletePrimaryPromotesAnother() {
        UserDepartmentMembership primary = S2IamFixtures.createMembershipTx(
            tenant.id, userA, branch, deptA, null, true);
        UserDepartmentMembership secondary = S2IamFixtures.createMembershipTx(
            tenant.id, userA, branch, deptB, null, false);

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + primary.id)
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_MEMBERSHIP_REMOVED"));

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "?user_id=" + userA.userId())
        .then()
            .statusCode(200)
            .body("data.items.size()", equalTo(1))
            .body("data.items[0].id", equalTo(secondary.id.toString()))
            .body("data.items[0].is_primary", equalTo(true));
    }

    @Test
    @DisplayName("S2IAM-MB-04: Chặn vòng lặp tuyến quản lý báo cáo khi gán quản lý trực tiếp")
    public void reportingCycleBlocked() {
        S2IamFixtures.createMembershipTx(tenant.id, userA, branch, deptA, userB.userId(), true);

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(body(userB, deptA, userA.userId().toString(), true))
        .when()
            .post(PATH)
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo("ORGANIZATION_REPORTING_CYCLE_DETECTED"))
            .body("errors[0].field", equalTo("direct_manager_user_id"))
            .body("errors[0].code", equalTo("VALIDATION_MANAGEMENT_CYCLE_FORBIDDEN"));
    }

    @Test
    @DisplayName("S2IAM-MB-05: Cấm tham chiếu user thuộc tenant khác")
    public void crossTenantUserBlocked() {
        Tenant otherTenant = S2IamFixtures.createTenantTx("member-other");
        Person foreigner = S2IamFixtures.createUserTx(otherTenant.id, "s2iam.member.foreign@example.com", "Foreigner");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(body(foreigner, deptA, null, true))
        .when()
            .post(PATH)
        .then()
            .statusCode(400)
            .body("code", equalTo("ORGANIZATION_CROSS_TENANT_REFERENCE"));
    }

    @Test
    @DisplayName("S2IAM-MB-06: Membership branch phải khớp branch của phòng ban")
    public void branchMismatchBlocked() {
        Branch otherBranch = S2IamFixtures.createBranchTx(tenant.id, "MB2", "Chi nhánh MB2");
        Map<String, Object> request = body(userA, deptA, null, true);
        request.put("branch_id", otherBranch.id.toString());

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post(PATH)
        .then()
            .statusCode(400)
            .body("code", equalTo("ORGANIZATION_MEMBERSHIP_BRANCH_MISMATCH"));
    }
}
