package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.fail;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.PermissionInvalidationService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.Role;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.redis.datasource.RedisDataSource;
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
public class UserRoleApiTest {

    private static final String ROLES_PATH = "/api/v1/iam/roles";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    @Inject
    PermissionInvalidationService permissionInvalidationService;

    @Inject
    RedisDataSource redis;

    private Tenant tenant;
    private Person admin;
    private Person staff;
    private String bearer;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        tenant = S2IamFixtures.createTenant("userrole");
        admin = S2IamFixtures.createUser(tenant.id, "s2iam.userrole.admin@example.com", "User Role Admin");
        staff = S2IamFixtures.createUser(tenant.id, "s2iam.userrole.staff@example.com", "User Role Staff");
        bearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
    }

    @Test
    @DisplayName("S2IAM-UR-01: Danh bạ user tenant lọc keyword và gán/gỡ vai trò cho user")
    public void userDirectoryAndRoleLifecycle() {
        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/users?keyword=s2iam.userrole.staff")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_USER_LIST_SUCCESS"))
            .body("data.items.size()", equalTo(1))
            .body("data.items[0].user_id", equalTo(staff.userId().toString()))
            .body("data.items[0].email", equalTo(staff.email()))
            .body("data.total_items", equalTo(1));

        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "ASSIGNABLE", "Vai trò gán");

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/users/" + staff.userId() + "/roles")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_USER_ROLE_LIST_SUCCESS"))
            .body("data.items.size()", equalTo(0));

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("role_ids", List.of(role.id.toString())))
        .when()
            .post("/api/v1/iam/users/" + staff.userId() + "/roles")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_USER_ROLES_ASSIGNED"))
            .body("data.assigned_roles_count", equalTo(1));

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/users/" + staff.userId() + "/roles")
        .then()
            .statusCode(200)
            .body("data.items.size()", equalTo(1))
            .body("data.items[0].code", equalTo("S2IAM-ASSIGNABLE"));

        given()
            .header("Authorization", bearer)
        .when()
            .delete("/api/v1/iam/users/" + staff.userId() + "/roles/" + role.id)
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_USER_ROLE_REMOVED"));

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/users/" + staff.userId() + "/roles")
        .then()
            .statusCode(200)
            .body("data.items.size()", equalTo(0));
    }

    @Test
    @DisplayName("S2IAM-UR-02: Chặn gỡ vai trò TENANT_OWNER cuối cùng của tenant")
    public void lastTenantOwnerProtected() {
        Role ownerRole = S2IamFixtures.systemRole("TENANT_OWNER");
        S2IamFixtures.assignRoleTx(tenant.id, admin, ownerRole);

        given()
            .header("Authorization", bearer)
        .when()
            .delete("/api/v1/iam/users/" + admin.userId() + "/roles/" + ownerRole.id)
        .then()
            .statusCode(409)
            .body("success", equalTo(false))
            .body("code", equalTo("IAM_USER_ROLE_REQUIRED"));

        S2IamFixtures.assignRoleTx(tenant.id, staff, ownerRole);

        given()
            .header("Authorization", bearer)
        .when()
            .delete("/api/v1/iam/users/" + admin.userId() + "/roles/" + ownerRole.id)
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_USER_ROLE_REMOVED"));
    }

    @Test
    @DisplayName("S2IAM-UR-03: Gán user vào role + danh sách user của role")
    public void assignUsersToRole() {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "ROLETEAM", "Vai trò nhóm");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("user_ids", List.of(staff.userId().toString())))
        .when()
            .post(ROLES_PATH + "/" + role.id + "/users")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_USER_ROLES_ASSIGNED"))
            .body("data.assigned_users_count", equalTo(1));

        given()
            .header("Authorization", bearer)
        .when()
            .get(ROLES_PATH + "/" + role.id + "/users")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_USER_ROLE_LIST_SUCCESS"))
            .body("data.items.size()", equalTo(1))
            .body("data.items[0].user_id", equalTo(staff.userId().toString()))
            .body("data.items[0].email", equalTo(staff.email()));

        Response roles = given()
            .header("Authorization", bearer)
        .when()
            .get(ROLES_PATH)
        .then()
            .statusCode(200)
        .extract().response();
        int assignedCount = roles.path("data.items.find { it.id == '" + role.id + "' }.assigned_users_count");
        org.junit.jupiter.api.Assertions.assertEquals(1, assignedCount);
    }

    @Test
    @DisplayName("S2IAM-UR-04: Gán vai trò cho user phát sự kiện vô hiệu hóa cache")
    public void userRoleAssignmentInvalidatesCache() throws InterruptedException {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "ROLECACHE", "Vai trò cache user");
        String key = permissionInvalidationService.contextKey(tenant.id, staff.userId());
        redis.value(String.class).set(key, "stale-context");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("role_ids", List.of(role.id.toString())))
        .when()
            .post("/api/v1/iam/users/" + staff.userId() + "/roles")
        .then()
            .statusCode(200);

        awaitKeyDeleted(key);
    }

    private void awaitKeyDeleted(String key) throws InterruptedException {
        for (int attempt = 0; attempt < 40; attempt++) {
            if (!redis.key(String.class).exists(key)) {
                return;
            }
            Thread.sleep(100);
        }
        fail("Role assignment did not invalidate Redis key " + key);
    }
}
