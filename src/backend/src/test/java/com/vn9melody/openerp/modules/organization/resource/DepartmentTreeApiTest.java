package com.vn9melody.openerp.modules.organization.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

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
public class DepartmentTreeApiTest {

    private static final String PATH = "/api/v1/organization/departments";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    private Tenant tenant;
    private Person admin;
    private String bearer;
    private Branch branchA;
    private Branch branchB;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        tenant = S2IamFixtures.createTenant("dept");
        admin = S2IamFixtures.createUser(tenant.id, "s2iam.dept.admin@example.com", "Dept Admin");
        branchA = S2IamFixtures.createBranch(tenant.id, "A", "Chi nhánh A");
        branchB = S2IamFixtures.createBranch(tenant.id, "B", "Chi nhánh B");
        bearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
    }

    private String createDepartment(String code, String name, Branch branch, String parentId) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", code);
        body.put("name", name);
        body.put("branch_id", branch != null ? branch.id.toString() : null);
        body.put("parent_id", parentId);
        Response response = given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(body)
        .when()
            .post(PATH)
        .then()
            .statusCode(201)
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_CREATED_SUCCESS"))
        .extract().response();
        return response.path("data.id");
    }

    @Test
    @DisplayName("S2IAM-DP-01: Cây phòng ban đa cấp hiển thị phân cấp chính xác")
    public void nestedTree() {
        String rootId = createDepartment("KD", "Khối Kinh Doanh", branchA, null);
        createDepartment("KD-B2B", "Phòng B2B", branchA, rootId);

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "/tree")
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_TREE_SUCCESS"))
            .body("data.items.find { it.code == 'KD' }.children.size()", equalTo(1))
            .body("data.items.find { it.code == 'KD' }.children[0].code", equalTo("KD-B2B"))
            .body("data.items.find { it.code == 'KD' }.branch_id", equalTo(branchA.id.toString()));

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "?tree=true")
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_TREE_SUCCESS"));
    }

    @Test
    @DisplayName("S2IAM-DP-02: Chặn tạo phòng ban vượt quá depth 5")
    public void depthLimitEnforced() {
        String parentId = null;
        for (int depth = 1; depth <= 5; depth++) {
            parentId = createDepartment("D" + depth, "Cấp " + depth, branchA, parentId);
        }

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "D6", "name", "Cấp 6", "branch_id", branchA.id.toString(), "parent_id", parentId))
        .when()
            .post(PATH)
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_DEPTH_EXCEEDED"));
    }

    @Test
    @DisplayName("S2IAM-DP-03: Di chuyển phòng ban tạo vòng lặp bị chặn")
    public void moveCycleBlocked() {
        String rootId = createDepartment("CYCLE", "Phòng gốc", branchA, null);
        String childId = createDepartment("CYCLE-CON", "Phòng con", branchA, rootId);

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("new_parent_id", childId))
        .when()
            .post(PATH + "/" + rootId + "/move")
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_CYCLE_DETECTED"));

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("new_parent_id", childId))
        .when()
            .put(PATH + "/" + rootId + "/move")
        .then()
            .statusCode(400)
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_CYCLE_DETECTED"));
    }

    @Test
    @DisplayName("S2IAM-DP-04: Di chuyển phòng ban sang chi nhánh khác cập nhật branch của phòng ban và membership")
    public void moveToOtherBranch() {
        String deptId = createDepartment("MOVE", "Phòng chuyển", branchA, null);
        String parentId = createDepartment("MOVE-TARGET", "Phòng đích", branchB, null);

        Department department = Department.findById(java.util.UUID.fromString(deptId));
        Person member = S2IamFixtures.createUserTx(tenant.id, "s2iam.dept.member@example.com", "Dept Member");
        S2IamFixtures.createMembershipTx(tenant.id, member, branchA, department, null, true);

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("new_parent_id", parentId))
        .when()
            .post(PATH + "/" + deptId + "/move")
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_MOVED"))
            .body("data.branch_id", equalTo(branchB.id.toString()));

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/organization/memberships?department_id=" + deptId + "&user_id=" + member.userId())
        .then()
            .statusCode(200)
            .body("data.items[0].branch_id", equalTo(branchB.id.toString()));
    }

    @Test
    @DisplayName("S2IAM-DP-05: Chặn xóa phòng ban còn phòng con hoặc còn thành viên")
    public void deleteGuards() {
        String rootId = createDepartment("DEL", "Phòng xóa", branchA, null);
        createDepartment("DEL-CON", "Phòng con", branchA, rootId);

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + rootId)
        .then()
            .statusCode(409)
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_IN_USE"));

        String leafId = createDepartment("DEL-LEAF", "Phòng lá", branchA, null);
        Department leaf = Department.findById(java.util.UUID.fromString(leafId));
        Person member = S2IamFixtures.createUserTx(tenant.id, "s2iam.dept.leaf@example.com", "Leaf Member");
        S2IamFixtures.createMembershipTx(tenant.id, member, branchA, leaf, null, true);

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + leafId)
        .then()
            .statusCode(409)
            .body("code", equalTo("ORGANIZATION_DEPARTMENT_IN_USE"));
    }

    @Test
    @DisplayName("S2IAM-DP-06: GET /departments/{id}/members trả danh sách thành viên của phòng ban")
    public void departmentMembers() {
        String deptId = createDepartment("MEM", "Phòng thành viên", branchA, null);
        Department department = Department.findById(java.util.UUID.fromString(deptId));
        Person member = S2IamFixtures.createUserTx(tenant.id, "s2iam.dept.mem@example.com", "Member");
        S2IamFixtures.createMembershipTx(tenant.id, member, branchA, department, null, true);

        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH + "/" + deptId + "/members")
        .then()
            .statusCode(200)
            .body("code", equalTo("ORGANIZATION_MEMBERSHIP_LIST_SUCCESS"))
            .body("data.items[0].user_id", equalTo(member.userId().toString()))
            .body("data.items[0].user_email", notNullValue());
    }
}
