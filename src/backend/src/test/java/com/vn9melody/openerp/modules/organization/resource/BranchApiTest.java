package com.vn9melody.openerp.modules.organization.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.model.Department;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
@TestProfile(com.vn9melody.openerp.support.S2IamTestProfile.class)
public class BranchApiTest {

    private static final String PATH = "/api/v1/organization/branches";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    private Tenant tenant;
    private Person admin;
    private String bearer;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        tenant = S2IamFixtures.createTenant("branch");
        admin = S2IamFixtures.createUser(tenant.id, "s2iam.branch.admin@example.com", "Branch Admin");
        bearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
    }

    @Test
    @DisplayName("S2IAM-BR-01: Tạo chi nhánh trả 201, mã chuẩn, chi nhánh đầu tiên là mặc định; trùng mã bị chặn")
    public void createAndDuplicateBranch() {
        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-HN", "name", "Chi nhánh Hà Nội", "phone", "0243123456", "address", "Hà Nội"))
        .when()
            .post(PATH)
        .then()
            .statusCode(201)
            .body("success", equalTo(true))
            .body("code", equalTo("ORGANIZATION_BRANCH_CREATED_SUCCESS"))
            .body("data.id", notNullValue())
            .body("data.code", equalTo("S2IAM-HN"))
            .body("data.is_default", equalTo(true))
            .body("data.status", equalTo("ACTIVE"));

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-HN", "name", "Chi nhánh trùng"))
        .when()
            .post(PATH)
        .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("code", equalTo("ORGANIZATION_BRANCH_CODE_EXISTS"));
    }

    @Test
    @DisplayName("S2IAM-BR-02: Danh sách + cập nhật chi nhánh theo PATCH/PUT")
    public void listAndUpdateBranch() {
        Branch branch = S2IamFixtures.createBranchTx(tenant.id, "DN", "Chi nhánh Đà Nẵng");

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_BRANCH_LIST_SUCCESS"))
            .body("data.items.size()", greaterThanOrEqualTo(1));

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-DN", "name", "Chi nhánh Đà Nẵng (mới)", "phone", "0236333123"))
        .when()
            .patch(PATH + "/" + branch.id)
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_BRANCH_UPDATED"))
            .body("data.name", equalTo("Chi nhánh Đà Nẵng (mới)"));

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-DN", "name", "Chi nhánh Đà Nẵng (PUT)"))
        .when()
            .put(PATH + "/" + branch.id)
        .then()
            .statusCode(200)
            .body("data.name", equalTo("Chi nhánh Đà Nẵng (PUT)"));
    }

    @Test
    @DisplayName("S2IAM-BR-03: Không thể xóa chi nhánh còn membership đang hoạt động")
    public void deleteBranchWithMembersBlocked() {
        Branch branch = S2IamFixtures.createBranchTx(tenant.id, "HCM", "Chi nhánh HCM");
        Department department = S2IamFixtures.createDepartmentTx(tenant.id, branch.id, null, "KD");
        Person member = S2IamFixtures.createUserTx(tenant.id, "s2iam.branch.member@example.com", "Member");
        S2IamFixtures.createMembershipTx(tenant.id, member, branch, department, null, true);

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + branch.id)
        .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("code", equalTo("ORGANIZATION_BRANCH_HAS_MEMBERS"));
    }

    @Test
    @DisplayName("S2IAM-BR-04: Xóa mềm chi nhánh trống chuyển trạng thái INACTIVE")
    public void softDeleteEmptyBranch() {
        Branch branch = S2IamFixtures.createBranchTx(tenant.id, "CT", "Chi nhánh Cần Thơ");

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + branch.id)
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_BRANCH_DELETED"));

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "/" + branch.id)
        .then()
            .statusCode(200)
            .body("data.status", equalTo("INACTIVE"));
    }

    @Test
    @DisplayName("S2IAM-BR-05: Thiếu token trả 401")
    public void unauthenticatedRejected() {
        given()
        .when()
            .get(PATH)
        .then()
            .statusCode(401);
    }
}
