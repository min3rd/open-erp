package com.vn9melody.openerp.modules.catalog.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;

import com.vn9melody.openerp.modules.iam.model.Role;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-378 / TASK-382: type CRUD, per-role grants, two-tier enforcement and
 * tenant isolation (AC-09, AC-16).
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogTypeApiTest extends CatalogApiTestBase {

    @Test
    @DisplayName("TASK-378: tenant type CRUD, code immutable, duplicate rejected, grants defaulted")
    void typeCrudAndDefaults() {
        String typeId = createTenantType(bearerA, PREFIX + "_TYPE_CRUD", "DAG",
            List.of("HIERARCHY", "CLASSIFICATION"), null, true, null);

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types")
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_TYPE_FETCH_SUCCESS"))
            .body("data.items.find { it.code == '" + PREFIX + "_TYPE_CRUD' }.is_system", equalTo(false))
            .body("data.items.find { it.code == 'PROVINCE' }.is_system", equalTo(true));

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("code", PREFIX + "_TYPE_CRUD", "name_key", "CATALOG_TYPE_DUP"))
        .when()
            .post(CATALOG + "/types")
        .then()
            .statusCode(409)
            .body("code", equalTo("CATALOG_TYPE_CODE_EXISTS"));

        // code never changes on update
        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name_key", "CATALOG_TYPE_RENAMED", "code", "SHOULD_BE_IGNORED"))
        .when()
            .put(CATALOG + "/types/" + typeId)
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_TYPE_UPDATED_SUCCESS"))
            .body("data.code", equalTo(PREFIX + "_TYPE_CRUD"))
            .body("data.name_key", equalTo("CATALOG_TYPE_RENAMED"));

        // freshly created tenant types receive the default owner/admin grant
        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + PREFIX + "_TYPE_CRUD/grants")
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_GRANT_FETCH_SUCCESS"))
            .body("data.items.role_code", hasItem("TENANT_ADMIN"))
            .body("data.items.find { it.role_code == 'TENANT_ADMIN' }.can_write", equalTo(true));
    }

    @Test
    @DisplayName("TASK-382: module permission without a can_write grant answers CATALOG_TYPE_FORBIDDEN")
    void grantEnforcement() {
        String code = PREFIX + "_TYPE_GRANT";
        createTenantType(bearerA, code, "TREE", List.of("HIERARCHY"), null, null, null);
        Role adminRole = S2IamFixtures.systemRole("TENANT_ADMIN");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("grants", List.of(Map.of(
                "role_id", adminRole.id.toString(), "can_read", true, "can_write", false))))
        .when()
            .put(CATALOG + "/types/" + code + "/grants")
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_GRANT_UPDATED_SUCCESS"))
            .body("data.items.find { it.role_code == 'TENANT_ADMIN' }.can_write", equalTo(false));

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("code", PREFIX + "_ITEM_DENIED", "name", "Denied item"))
        .when()
            .post(CATALOG + "/types/" + code + "/items")
        .then()
            .log().ifValidationFails()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo("CATALOG_TYPE_FORBIDDEN"));

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("grants", List.of(Map.of(
                "role_id", adminRole.id.toString(), "can_read", true, "can_write", true))))
        .when()
            .put(CATALOG + "/types/" + code + "/grants")
        .then()
            .statusCode(200);

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("code", PREFIX + "_ITEM_ALLOWED", "name", "Allowed item"))
        .when()
            .post(CATALOG + "/types/" + code + "/items")
        .then()
            .statusCode(201)
            .body("code", equalTo("CATALOG_ITEM_CREATED_SUCCESS"));

        // can_read=false also blocks the admin list
        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("grants", List.of(Map.of(
                "role_id", adminRole.id.toString(), "can_read", false, "can_write", true))))
        .when()
            .put(CATALOG + "/types/" + code + "/grants")
        .then()
            .statusCode(200);

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + code + "/items")
        .then()
            .statusCode(403)
            .body("code", equalTo("CATALOG_TYPE_FORBIDDEN"));
    }

    @Test
    @DisplayName("TASK-378: system types are read-only for tenants; grants on them are forbidden")
    void systemTypeReadOnly() {
        String systemTypeId = given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types")
        .then()
            .statusCode(200)
            .body("data.items.find { it.code == 'PROVINCE' }.is_system", equalTo(true))
        .extract().path("data.items.find { it.code == 'PROVINCE' }.id");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name_key", "CATALOG_TYPE_PROVINCE_HACKED"))
        .when()
            .put(CATALOG + "/types/" + systemTypeId)
        .then()
            .statusCode(403)
            .body("code", equalTo("CATALOG_TYPE_FORBIDDEN"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/PROVINCE/grants")
        .then()
            .statusCode(403)
            .body("code", equalTo("CATALOG_TYPE_FORBIDDEN"));
    }

    @Test
    @DisplayName("AC-15: tenant B cannot read or update tenant A's type")
    void tenantIsolation() {
        String typeId = createTenantType(bearerA, PREFIX + "_TYPE_ISO", "TREE", List.of("HIERARCHY"),
            null, null, null);

        given()
            .header("Authorization", bearerB)
            .contentType(ContentType.JSON)
            .body(Map.of("name_key", "CATALOG_TYPE_STOLEN"))
        .when()
            .put(CATALOG + "/types/" + typeId)
        .then()
            .statusCode(404)
            .body("code", equalTo("CATALOG_TYPE_NOT_FOUND"));

        given()
            .header("Authorization", bearerB)
        .when()
            .get(CATALOG + "/types/" + PREFIX + "_TYPE_ISO/grants")
        .then()
            .statusCode(404)
            .body("code", equalTo("CATALOG_TYPE_NOT_FOUND"))
            .body("success", equalTo(false));
    }

    @Test
    @DisplayName("TASK-378: grants validate that the role belongs to the tenant or is a system role")
    void grantRoleValidation() {
        String code = PREFIX + "_TYPE_ROLE";
        createTenantType(bearerA, code, "TREE", List.of("HIERARCHY"), null, null, null);
        String foreignRoleId = S2IamFixtures.createCustomRoleTx(tenantB.id, "FOREIGN", "Foreign role").id.toString();

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("grants", List.of(Map.of("role_id", foreignRoleId, "can_read", true))))
        .when()
            .put(CATALOG + "/types/" + code + "/grants")
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("errors[0].field", equalTo("role_id"));
    }

    @Test
    @DisplayName("TASK-392: tenant tokens cannot reach the platform system-catalog admin")
    void platformSystemCatalogDeniedForTenants() {
        given()
            .header("Authorization", bearerA)
        .when()
            .get("/api/v1/catalog/system/types")
        .then()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo("PLATFORM_ACCESS_DENIED"));
    }
}
