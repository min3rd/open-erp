package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;
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
public class RolePermissionApiTest {

    private static final String PERMISSIONS_PATH = "/api/v1/iam/permissions";
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
    private String bearer;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        tenant = S2IamFixtures.createTenant("perm");
        admin = S2IamFixtures.createUser(tenant.id, "s2iam.perm.admin@example.com", "Perm Admin");
        bearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
    }

    @Test
    @DisplayName("S2IAM-RP-01: Danh mục quyền trả về domain/resource/action đầy đủ")
    public void permissionCatalog() {
        given()
            .header("Authorization", bearer)
        .when()
            .get(PERMISSIONS_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_PERMISSION_LIST_SUCCESS"))
            .body("data.items.size()", greaterThanOrEqualTo(20))
            .body("data.items[0].domain", notNullValue())
            .body("data.items.find { it.code == 'core:sample-record:read' }.resource", equalTo("sample-record"));
    }

    @Test
    @DisplayName("S2IAM-RP-02: Gán quyền cho vai trò (replace toàn bộ) và đọc lại")
    public void replaceRolePermissions() {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "PERMROLE", "Vai trò quyền");
        Response catalog = given()
            .header("Authorization", bearer)
        .when()
            .get(PERMISSIONS_PATH)
        .then()
            .statusCode(200)
        .extract().response();

        List<String> ids = catalog.path("data.items.findAll { it.code in ['core:role:read','core:role:manage'] }.id");
        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("permission_ids", ids))
        .when()
            .put(ROLES_PATH + "/" + role.id + "/permissions")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_PERMISSIONS_UPDATED"))
            .body("data.total_permissions_granted", equalTo(2));

        given()
            .header("Authorization", bearer)
        .when()
            .get(ROLES_PATH + "/" + role.id + "/permissions")
        .then()
            .statusCode(200)
            .body("data.items.size()", equalTo(2));

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("permission_ids", List.of()))
        .when()
            .put(ROLES_PATH + "/" + role.id + "/permissions")
        .then()
            .statusCode(200)
            .body("data.total_permissions_granted", equalTo(0));

        given()
            .header("Authorization", bearer)
        .when()
            .get(ROLES_PATH + "/" + role.id + "/permissions")
        .then()
            .statusCode(200)
            .body("data.items.size()", equalTo(0));
    }

    @Test
    @DisplayName("S2IAM-RP-03: Từ chối quyền không nằm trong catalog")
    public void unknownPermissionRejected() {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "PERMUNK", "Vai trò lạ");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("permission_ids", List.of("core:not-a-real:permission")))
        .when()
            .put(ROLES_PATH + "/" + role.id + "/permissions")
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo("IAM_PERMISSION_UNKNOWN"))
            .body("errors[0].field", equalTo("permission_ids"))
            .body("errors[0].code", equalTo("IAM_PERMISSION_UNKNOWN"));
    }

    @Test
    @DisplayName("S2IAM-RP-04: Đổi quyền vai trò phát sự kiện vô hiệu hóa cache sec:ctx")
    public void permissionChangeInvalidatesCache() throws InterruptedException {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "PERMCACHE", "Vai trò cache");
        S2IamFixtures.assignRoleTx(tenant.id, admin, role);
        String key = permissionInvalidationService.contextKey(tenant.id, admin.userId());
        redis.value(String.class).set(key, "stale-context");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("permission_ids", List.of("core:role:read")))
        .when()
            .put(ROLES_PATH + "/" + role.id + "/permissions")
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
        fail("Permission invalidation did not delete Redis key " + key);
    }
}
