package com.vn9melody.openerp.modules.iam.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.Role;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamTestProfile;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class DataPolicyApiTest {

    private static final String RESOURCE = "CORE_SAMPLE_RECORD";

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
        tenant = S2IamFixtures.createTenant("policy");
        admin = S2IamFixtures.createUser(tenant.id, "s2iam.policy.admin@example.com", "Policy Admin");
        bearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
    }

    @Test
    @DisplayName("S2IAM-PL-01: Catalog data-resource lấy từ Entity Registry kèm scope_fields")
    public void dataResourceCatalog() {
        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/data-resources")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_DATA_RESOURCE_LIST_SUCCESS"))
            .body("data.items.size()", greaterThanOrEqualTo(1))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.entity_class", equalTo("CoreSampleRecord"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.table_name", equalTo("core_sample_records"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.plugin", equalTo("core"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.supports_assignee", equalTo(true))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.scope_fields",
                org.hamcrest.Matchers.hasItems("branch_id", "department_id", "created_by", "assignee_id"));
    }

    @Test
    @DisplayName("S2IAM-PL-02: Ma trận role × resource mặc định NONE và cập nhật qua PUT policies")
    public void policyMatrixDefaultsAndUpdate() {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "POLICY", "Vai trò policy");

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/roles/" + role.id + "/data-policies")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_DATA_POLICIES_SUCCESS"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.read_scope", equalTo("NONE"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.create_scope", equalTo("NONE"));

        Map<String, Object> policy = new HashMap<>();
        policy.put("resource", RESOURCE);
        policy.put("create_scope", "BRANCH");
        policy.put("read_scope", "OWN_AND_SUBORDINATES");
        policy.put("update_scope", "OWN_ONLY");
        policy.put("delete_scope", "NONE");
        policy.put("export_scope", "NONE");
        policy.put("share_scope", "DEPARTMENT");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("policies", List.of(policy)))
        .when()
            .put("/api/v1/iam/roles/" + role.id + "/data-policies")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_DATA_POLICIES_UPDATED"))
            .body("data.role_id", equalTo(role.id.toString()))
            .body("data.updated_count", equalTo(1));

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/roles/" + role.id + "/data-policies")
        .then()
            .statusCode(200)
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.create_scope", equalTo("BRANCH"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.read_scope", equalTo("OWN_AND_SUBORDINATES"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.share_scope", equalTo("DEPARTMENT"));
    }

    @Test
    @DisplayName("S2IAM-PL-03: Scope không hợp lệ bị chặn với VALIDATION_INVALID_DATA_SCOPE")
    public void invalidScopeRejected() {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "BADPOLICY", "Vai trò sai scope");

        Map<String, Object> policy = new HashMap<>();
        policy.put("resource", RESOURCE);
        policy.put("read_scope", "EVERYTHING");

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("policies", List.of(policy)))
        .when()
            .put("/api/v1/iam/roles/" + role.id + "/data-policies")
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo("VALIDATION_INVALID_DATA_SCOPE"))
            .body("errors[0].code", equalTo("VALIDATION_INVALID_DATA_SCOPE"));
    }

    @Test
    @DisplayName("S2IAM-PL-04: PUT /iam/data-policies upsert theo operation + self view /me/data-scopes")
    public void flatUpsertAndSelfView() {
        Role role = S2IamFixtures.createCustomRoleTx(tenant.id, "FLAT", "Vai trò flat");
        S2IamFixtures.assignRoleTx(tenant.id, admin, role);

        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("items", List.of(
                Map.of("role_id", role.id.toString(), "resource", RESOURCE, "operation", "READ", "scope", "BRANCH")
            )))
        .when()
            .put("/api/v1/iam/data-policies")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_DATA_POLICIES_UPDATED"))
            .body("data.updated_count", equalTo(1));

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/data-policies?role_id=" + role.id)
        .then()
            .statusCode(200)
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.read_scope", equalTo("BRANCH"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.create_scope", equalTo("NONE"));

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/me/data-scopes")
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ME_DATA_SCOPES_SUCCESS"))
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.read_scope", equalTo("BRANCH"));
    }

    @Test
    @DisplayName("S2IAM-PL-05: Nguyên tắc gộp quyền mở rộng nhất khi user có nhiều vai trò")
    public void mostPermissiveUnion() {
        Role narrow = S2IamFixtures.createCustomRoleTx(tenant.id, "NARROW", "Vai trò hẹp");
        Role wide = S2IamFixtures.createCustomRoleTx(tenant.id, "WIDE", "Vai trò rộng");
        S2IamFixtures.assignRoleTx(tenant.id, admin, narrow);
        S2IamFixtures.assignRoleTx(tenant.id, admin, wide);

        putPolicy(narrow.id.toString(), "OWN_ONLY");
        putPolicy(wide.id.toString(), "DEPARTMENT");

        given()
            .header("Authorization", bearer)
        .when()
            .get("/api/v1/iam/me/data-scopes")
        .then()
            .statusCode(200)
            .body("data.items.find { it.resource == '" + RESOURCE + "' }.read_scope", equalTo("DEPARTMENT"));
    }

    private void putPolicy(String roleId, String readScope) {
        Map<String, Object> policy = new HashMap<>();
        policy.put("resource", RESOURCE);
        policy.put("read_scope", readScope);
        given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("policies", List.of(policy)))
        .when()
            .put("/api/v1/iam/roles/" + roleId + "/data-policies")
        .then()
            .statusCode(200);
    }
}
