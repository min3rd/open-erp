package com.vn9melody.openerp.modules.catalog.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-381 / TASK-391: lazy options contract (paging, tenant-wins merge,
 * override badge, hide), batch resolve, breadcrumb path and inline quick-create
 * with its own permission (AC-10/11/12/20).
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogLookupApiTest extends CatalogApiTestBase {

    @Test
    @DisplayName("AC-20: tenant override wins in options and INACTIVE hides the system row for that tenant only")
    void tenantOverrideAndHide() {
        String typeCode = PREFIX + "_OVR_TYPE";
        UUID systemTypeId = createSystemType(typeCode, CatalogHierarchyMode.DAG);
        createSystemItem(systemTypeId, PREFIX + "_OVR_1", "System one");
        createSystemItem(systemTypeId, PREFIX + "_OVR_2", "System two");

        String overrideItemId = createItem(bearerA, typeCode, PREFIX + "_OVR_1", "Tenant one");

        // admin list marks the tenant row as an override (badge "Ghi đè")
        given()
            .header("Authorization", bearerA)
            .queryParam("q", PREFIX + "_OVR_1")
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' && it.is_system == false }.overridden",
                equalTo(true))
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' && it.is_system == true }.overridden",
                equalTo(false));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_LOOKUP_OPTIONS_SUCCESS"))
            .body("data.items", hasSize(2))
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' }.name", equalTo("Tenant one"))
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' }.is_system", equalTo(false))
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' }.overridden", equalTo(true))
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_2' }.is_system", equalTo(true))
            .body("data.total_items", equalTo(2));

        given()
            .header("Authorization", bearerB)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' }.name", equalTo("System one"))
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' }.is_system", equalTo(true))
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' }.overridden", equalTo(false));

        // hiding = tenant row with the same code marked INACTIVE (new version)
        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("status", "INACTIVE"))
        .when()
            .put(CATALOG + "/items/" + overrideItemId)
        .then()
            .statusCode(200)
            .body("data.version", equalTo(2))
            .body("data.status", equalTo("INACTIVE"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].code", equalTo(PREFIX + "_OVR_2"))
            .body("data.total_items", equalTo(1));

        given()
            .header("Authorization", bearerB)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(2))
            .body("data.items.find { it.code == '" + PREFIX + "_OVR_1' }.name", equalTo("System one"));
    }

    @Test
    @DisplayName("AC-10: options are paginated (page 0-based, size max 100) and searchable")
    void optionsPagingAndSearch() {
        String typeCode = PREFIX + "_OPT_TYPE";
        createTenantType(bearerA, typeCode, "DAG", List.of("CLASSIFICATION"), null, true, null);
        createItem(bearerA, typeCode, PREFIX + "_OPT_A", "Alpha");
        createItem(bearerA, typeCode, PREFIX + "_OPT_B", "Beta");
        createItem(bearerA, typeCode, PREFIX + "_OPT_C", "Gamma");

        given()
            .header("Authorization", bearerA)
            .queryParam("page", 0)
            .queryParam("size", 2)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(2))
            .body("data.items[0].code", equalTo(PREFIX + "_OPT_A"))
            .body("data.page", equalTo(0))
            .body("data.size", equalTo(2))
            .body("data.total_items", equalTo(3))
            .body("data.total_pages", equalTo(2));

        given()
            .header("Authorization", bearerA)
            .queryParam("page", 1)
            .queryParam("size", 2)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].code", equalTo(PREFIX + "_OPT_C"));

        given()
            .header("Authorization", bearerA)
            .queryParam("q", "Gamma")
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].code", equalTo(PREFIX + "_OPT_C"));

        // size above the maximum is clamped to 100
        given()
            .header("Authorization", bearerA)
            .queryParam("size", 500)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.size", equalTo(100));
    }

    @Test
    @DisplayName("AC-01/AC-11: hierarchical options expose parent_id/has_children/path; parent filter works")
    void hierarchicalOptionsAndPath() {
        String typeCode = PREFIX + "_TREE_TYPE";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);
        String root = createItem(bearerA, typeCode, PREFIX + "_TREE_ROOT", "Root");
        String child = createItem(bearerA, typeCode, PREFIX + "_TREE_CHILD", "Child");
        String grandChild = createItem(bearerA, typeCode, PREFIX + "_TREE_GC", "Grandchild");
        createEdge(bearerA, root, child, "HIERARCHY");
        createEdge(bearerA, child, grandChild, "HIERARCHY");

        given()
            .header("Authorization", bearerA)
            .queryParam("parent_id", root)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].id", equalTo(child))
            .body("data.items[0].parent_id", equalTo(root))
            .body("data.items[0].has_children", equalTo(true));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items.find { it.code == '" + PREFIX + "_TREE_GC' }.path",
                equalTo("Root / Child"))
            .body("data.items.find { it.code == '" + PREFIX + "_TREE_ROOT' }.has_children",
                equalTo(true));

        given()
            .header("Authorization", bearerA)
            .queryParam("id", grandChild)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/path")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(3))
            .body("data.items[0].code", equalTo(PREFIX + "_TREE_ROOT"))
            .body("data.items[2].code", equalTo(PREFIX + "_TREE_GC"));
    }

    @Test
    @DisplayName("AC-11: resolve returns the requested items in one call")
    void resolveBatch() {
        String typeCode = PREFIX + "_RES_TYPE";
        createTenantType(bearerA, typeCode, "DAG", List.of("CLASSIFICATION"), null, null, null);
        String first = createItem(bearerA, typeCode, PREFIX + "_RES_1", "First");
        String second = createItem(bearerA, typeCode, PREFIX + "_RES_2", "Second");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("ids", List.of(first, second)))
        .when()
            .post(CATALOG + "/lookup/" + typeCode + "/resolve")
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_LOOKUP_RESOLVE_SUCCESS"))
            .body("data.items", hasSize(2));
    }

    @Test
    @DisplayName("AC-12: inline create requires its own permission and rejects duplicates")
    void inlineCreate() {
        String typeCode = PREFIX + "_INLINE_TYPE";
        createTenantType(bearerA, typeCode, "DAG", List.of("CLASSIFICATION"), null, true, null);

        String itemId = given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name", "Accountant"))
        .when()
            .post(CATALOG + "/lookup/" + typeCode + "/inline")
        .then()
            .statusCode(201)
            .body("code", equalTo("CATALOG_LOOKUP_INLINE_SUCCESS"))
            .body("data.code", equalTo("ACCOUNTANT"))
            .body("data.name", equalTo("Accountant"))
            .body("data.is_system", equalTo(false))
            .extract().path("data.id");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name", "Accountant"))
        .when()
            .post(CATALOG + "/lookup/" + typeCode + "/inline")
        .then()
            .statusCode(409)
            .body("code", equalTo("CATALOG_LOOKUP_INLINE_DUPLICATE"));

        // VIEWER lacks catalog:item:inline-create
        given()
            .header("Authorization", viewerBearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name", "Denied"))
        .when()
            .post(CATALOG + "/lookup/" + typeCode + "/inline")
        .then()
            .statusCode(403)
            .body("code", equalTo("IAM_PERMISSION_DENIED_FUNCTIONAL"));

        // types without allow_free_text reject inline creation
        String strictType = PREFIX + "_INLINE_STRICT";
        createTenantType(bearerA, strictType, "DAG", List.of("CLASSIFICATION"), null, false, null);
        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name", "Not allowed"))
        .when()
            .post(CATALOG + "/lookup/" + strictType + "/inline")
        .then()
            .statusCode(400)
            .body("code", equalTo("CATALOG_LOOKUP_INLINE_NOT_ALLOWED"));

        // resolved inline item is visible in options
        given()
            .header("Authorization", bearerA)
            .queryParam("q", "Accountant")
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].id", equalTo(itemId));
    }

    @Test
    @DisplayName("AC-15: options never leak another tenant's rows")
    void optionsTenantIsolation() {
        String typeCode = PREFIX + "_OPT_ISO";
        createTenantType(bearerA, typeCode, "DAG", List.of("CLASSIFICATION"), null, null, null);
        createItem(bearerA, typeCode, PREFIX + "_OPT_ISO_1", "Tenant A item");

        given()
            .header("Authorization", bearerB)
        .when()
            .get(CATALOG + "/lookup/" + typeCode + "/options")
        .then()
            .statusCode(404)
            .body("code", equalTo("CATALOG_TYPE_NOT_FOUND"));
    }

    @Test
    @DisplayName("TASK-381: lookup/types lists the form schema for system and tenant types")
    void lookupTypes() {
        String typeCode = PREFIX + "_LOOKUP_TYPE";
        createTenantType(bearerA, typeCode, "DAG", List.of("CLASSIFICATION"), null, true, null);

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/lookup/types")
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_LOOKUP_TYPES_SUCCESS"))
            .body("data.items.find { it.code == '" + typeCode + "' }.allow_free_text", equalTo(true))
            .body("data.items.find { it.code == '" + typeCode + "' }.hierarchy_mode", equalTo("DAG"))
            .body("data.items.find { it.code == 'PROVINCE' }.hierarchy_mode", equalTo("TREE"));
    }
}
