package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.Role;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.UserRole;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
@TestProfile(com.vn9melody.openerp.support.S2IamTestProfile.class)
public class RoleApiTest {

    private static final String PATH = "/api/v1/iam/roles";

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
        tenant = S2IamFixtures.createTenant("role");
        admin = S2IamFixtures.createUser(tenant.id, "s2iam.role.admin@example.com", "Role Admin");
        bearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
    }

    @Test
    @DisplayName("S2IAM-RL-01: Danh sách vai trò gồm vai trò hệ thống; tạo vai trò tùy biến; trùng mã bị chặn")
    public void listSystemRolesAndCreateCustomRole() {
        given()
            .header("Authorization", bearer)
        .when()
            .get(PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_LIST_SUCCESS"))
            .body("data.items.size()", greaterThanOrEqualTo(5))
            .body("data.items.find { it.code == 'TENANT_OWNER' }.is_system", equalTo(true))
            .body("data.total_items", greaterThanOrEqualTo(5));

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-SALES", "name", "Kinh doanh", "description", "Vai trò thử nghiệm"))
        .when()
            .post(PATH)
        .then()
            .statusCode(201)
            .body("code", equalTo("IAM_ROLE_CREATED"))
            .body("data.id", org.hamcrest.Matchers.notNullValue())
            .body("data.is_system", equalTo(false));

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-SALES", "name", "Kinh doanh trùng"))
        .when()
            .post(PATH)
        .then()
            .statusCode(409)
            .body("code", equalTo("IAM_ROLE_CODE_EXISTS"));
    }

    @Test
    @DisplayName("S2IAM-RL-02: Vai trò hệ thống bất biến (không sửa/xóa)")
    public void systemRoleImmutable() {
        Response roles = given()
            .header("Authorization", bearer)
        .when()
            .get(PATH)
        .then()
            .statusCode(200)
        .extract().response();

        String systemRoleId = roles.path("data.items.find { it.code == 'TENANT_OWNER' }.id");
        String systemRoleName = roles.path("data.items.find { it.code == 'TENANT_OWNER' }.name");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "TENANT_OWNER", "name", systemRoleName + " (sửa)"))
        .when()
            .patch(PATH + "/" + systemRoleId)
        .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("code", equalTo("IAM_SYSTEM_ROLE_IMMUTABLE"));

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + systemRoleId)
        .then()
            .statusCode(409)
            .body("code", equalTo("IAM_SYSTEM_ROLE_IMMUTABLE"));
    }

    @Test
    @DisplayName("S2IAM-RL-03: Cập nhật vai trò tùy biến và chặn xóa khi còn người dùng")
    public void updateAndDeleteRoleInUse() {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "SALES2", "Kinh doanh 2");
        S2IamFixtures.assignRoleTx(tenant.id, admin, role);

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-SALES2", "name", "Kinh doanh 2 (mới)"))
        .when()
            .patch(PATH + "/" + role.id)
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_UPDATED"))
            .body("data.name", equalTo("Kinh doanh 2 (mới)"));

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + role.id)
        .then()
            .statusCode(409)
            .body("code", equalTo("IAM_ROLE_IN_USE"));

        QuarkusTransaction.requiringNew().run(() ->
            UserRole.delete("roleId = ?1", role.id));

        given()
            .header("Authorization", bearer)
        .when()
            .delete(PATH + "/" + role.id)
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_DELETED"));
    }
}
