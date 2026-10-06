package com.vn9melody.openerp.modules.catalog.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-380: multi-parent DAG edges, cycle rejection, relation/cross-type
 * allow-lists, min_parents on delete and tenant isolation (AC-03/04/05).
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogEdgeApiTest extends CatalogApiTestBase {

    @Test
    @DisplayName("AC-05: cycle and self-reference edges are rejected")
    void cycleRejected() {
        String typeCode = PREFIX + "_EDGE_DAG";
        createTenantType(bearerA, typeCode, "DAG", List.of("HIERARCHY"), null, null, null);
        String a = createItem(bearerA, typeCode, PREFIX + "_EDGE_A", "A");
        String b = createItem(bearerA, typeCode, PREFIX + "_EDGE_B", "B");
        String c = createItem(bearerA, typeCode, PREFIX + "_EDGE_C", "C");

        createEdge(bearerA, a, b, "HIERARCHY");
        createEdge(bearerA, b, c, "HIERARCHY");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("parent_item_id", c, "child_item_id", a, "relation_type", "HIERARCHY"))
        .when()
            .post(CATALOG + "/edges")
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo("CATALOG_EDGE_CYCLE"));

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("parent_item_id", a, "child_item_id", a, "relation_type", "HIERARCHY"))
        .when()
            .post(CATALOG + "/edges")
        .then()
            .statusCode(400)
            .body("code", equalTo("CATALOG_EDGE_SELF_REFERENCE"));

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("parent_item_id", a, "child_item_id", b, "relation_type", "HIERARCHY"))
        .when()
            .post(CATALOG + "/edges")
        .then()
            .statusCode(409)
            .body("code", equalTo("CATALOG_EDGE_DUPLICATE"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/items/" + a + "/descendants")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(2));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/items/" + c + "/parents")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].item_id", equalTo(b))
            .body("data.items[0].edge_id", org.hamcrest.Matchers.notNullValue())
            .body("data.items[0].relation_type", equalTo("HIERARCHY"));
    }

    @Test
    @DisplayName("TASK-380: cross-type parents require the child type's allowed_parent_types")
    void crossTypeParentAllowlist() {
        String parentType = PREFIX + "_PARENT_TYPE";
        String childType = PREFIX + "_CHILD_TYPE";
        String otherType = PREFIX + "_OTHER_TYPE";
        createTenantType(bearerA, parentType, "DAG", List.of("HIERARCHY"), null, null, null);
        createTenantType(bearerA, childType, "DAG", List.of("HIERARCHY"), List.of(parentType), null, null);
        createTenantType(bearerA, otherType, "DAG", List.of("HIERARCHY"), null, null, null);

        String parent = createItem(bearerA, parentType, PREFIX + "_PARENT_1", "Parent");
        String allowedChild = createItem(bearerA, childType, PREFIX + "_CHILD_1", "Allowed child");
        String other = createItem(bearerA, otherType, PREFIX + "_OTHER_1", "Other child");

        createEdge(bearerA, parent, allowedChild, "HIERARCHY");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("parent_item_id", parent, "child_item_id", other, "relation_type", "HIERARCHY"))
        .when()
            .post(CATALOG + "/edges")
        .then()
            .statusCode(400)
            .body("code", equalTo("CATALOG_EDGE_PARENT_TYPE_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("TASK-380: relations must be declared by the child type's allowed_relations")
    void relationAllowlist() {
        String flatType = PREFIX + "_FLAT_TYPE";
        createTenantType(bearerA, flatType, "FLAT", List.of(), null, null, null);
        String first = createItem(bearerA, flatType, PREFIX + "_FLAT_1", "Flat one");
        String second = createItem(bearerA, flatType, PREFIX + "_FLAT_2", "Flat two");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("parent_item_id", first, "child_item_id", second, "relation_type", "HIERARCHY"))
        .when()
            .post(CATALOG + "/edges")
        .then()
            .statusCode(400)
            .body("code", equalTo("CATALOG_EDGE_RELATION_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("TASK-380: min_parents blocks closing the last parent edge")
    void minParentsGuard() {
        String typeCode = PREFIX + "_MINP_TYPE";
        createTenantType(bearerA, typeCode, "DAG", List.of("HIERARCHY"), null, null, 1);
        String parentOne = createItem(bearerA, typeCode, PREFIX + "_MINP_P1", "Parent one");
        String parentTwo = createItem(bearerA, typeCode, PREFIX + "_MINP_P2", "Parent two");
        String child = createItem(bearerA, typeCode, PREFIX + "_MINP_C", "Child");

        String edgeId = createEdge(bearerA, parentOne, child, "HIERARCHY");
        given()
            .header("Authorization", bearerA)
        .when()
            .delete(CATALOG + "/edges/" + edgeId)
        .then()
            .statusCode(409)
            .body("code", equalTo("CATALOG_EDGE_MIN_PARENTS"));

        createEdge(bearerA, parentTwo, child, "HIERARCHY");
        given()
            .header("Authorization", bearerA)
        .when()
            .delete(CATALOG + "/edges/" + edgeId)
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_EDGE_CLOSED_SUCCESS"));
    }

    @Test
    @DisplayName("AC-15: tenant B cannot create an edge over tenant A's items")
    void tenantIsolation() {
        String typeCode = PREFIX + "_EDGE_ISO";
        createTenantType(bearerA, typeCode, "DAG", List.of("HIERARCHY"), null, null, null);
        String parent = createItem(bearerA, typeCode, PREFIX + "_EDGE_ISO_P", "A parent");
        String child = createItem(bearerA, typeCode, PREFIX + "_EDGE_ISO_C", "A child");

        given()
            .header("Authorization", bearerB)
            .contentType(ContentType.JSON)
            .body(Map.of("parent_item_id", parent, "child_item_id", child, "relation_type", "HIERARCHY"))
        .when()
            .post(CATALOG + "/edges")
        .then()
            .statusCode(404)
            .body("code", equalTo("CATALOG_ITEM_NOT_FOUND"));
    }

    @Test
    @DisplayName("TASK-380: relation types are enum-validated")
    void invalidRelationType() {
        String typeCode = PREFIX + "_EDGE_ENUM";
        createTenantType(bearerA, typeCode, "DAG", List.of("HIERARCHY"), null, null, null);
        String parent = createItem(bearerA, typeCode, PREFIX + "_EDGE_ENUM_P", "P");
        String child = createItem(bearerA, typeCode, PREFIX + "_EDGE_ENUM_C", "C");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("parent_item_id", parent, "child_item_id", child, "relation_type", "NOT_A_RELATION"))
        .when()
            .post(CATALOG + "/edges")
        .then()
            .statusCode(400)
            .body("code", equalTo("VALIDATION_FAILED"));
    }
}
