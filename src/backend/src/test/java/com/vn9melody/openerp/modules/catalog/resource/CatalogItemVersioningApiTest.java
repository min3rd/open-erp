package com.vn9melody.openerp.modules.catalog.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-379 / TASK-391: update creates version n+1 and closes the old row,
 * {@code as_of} reads the right version, delete closes validity, system rows are
 * read-only for tenants and cross-tenant access stays invisible (AC-06/07/08/15).
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogItemVersioningApiTest extends CatalogApiTestBase {

    @Test
    @DisplayName("AC-06/AC-08: three edits create three versions and as_of returns the matching one")
    void versioningAndAsOf() {
        String typeCode = PREFIX + "_VER";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);
        String itemId = createItem(bearerA, typeCode, PREFIX + "_VER_1", "Version one");

        Instant beforeFirstEdit = Instant.now();
        String versionTwoId = given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name", "Version two"))
        .when()
            .put(CATALOG + "/items/" + itemId)
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_ITEM_UPDATED_SUCCESS"))
            .body("data.version", equalTo(2))
            .body("data.name", equalTo("Version two"))
            .body("data.valid_to", equalTo(null))
        .extract().path("data.id");

        Instant beforeSecondEdit = Instant.now();
        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name", "Version three"))
        .when()
            .put(CATALOG + "/items/" + versionTwoId)
        .then()
            .statusCode(200)
            .body("data.version", equalTo(3));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/items/" + itemId + "/versions")
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_ITEM_FETCH_SUCCESS"))
            .body("data.items", hasSize(3))
            .body("data.items[0].version", equalTo(3))
            .body("data.items[0].valid_to", equalTo(null))
            .body("data.items[1].version", equalTo(2))
            .body("data.items[1].valid_to", org.hamcrest.Matchers.notNullValue())
            .body("data.items[2].version", equalTo(1));

        // as_of between edit 1 and edit 2 sees version 2
        given()
            .header("Authorization", bearerA)
            .queryParam("as_of", beforeSecondEdit.toString())
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].version", equalTo(2))
            .body("data.items[0].name", equalTo("Version two"));

        // as_of before the first edit sees version 1
        given()
            .header("Authorization", bearerA)
            .queryParam("as_of", beforeFirstEdit.toString())
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.items[0].version", equalTo(1))
            .body("data.items[0].name", equalTo("Version one"));

        // current view sees only the latest open version
        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].version", equalTo(3))
            .body("data.total_items", equalTo(1));
    }

    @Test
    @DisplayName("AC-06: delete closes valid_to and removes the row from current reads")
    void deleteClosesValidity() {
        String typeCode = PREFIX + "_DEL";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);
        String itemId = createItem(bearerA, typeCode, PREFIX + "_DEL_1", "Closing item");

        given()
            .header("Authorization", bearerA)
        .when()
            .delete(CATALOG + "/items/" + itemId)
        .then()
            .statusCode(200)
            .body("code", equalTo("CATALOG_ITEM_CLOSED_SUCCESS"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(0))
            .body("data.total_items", equalTo(0));

        // history is preserved, never hard-deleted
        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/items/" + itemId + "/versions")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].valid_to", org.hamcrest.Matchers.notNullValue());
    }

    @Test
    @DisplayName("TASK-379: system catalog rows are read-only for tenants (CATALOG_SYSTEM_ITEM_READONLY)")
    void systemItemReadOnly() {
        UUID systemTypeId = createSystemType(PREFIX + "_SYS_VER", CatalogHierarchyMode.TREE);
        UUID systemItemId = createSystemItem(systemTypeId, PREFIX + "_SYS_ITEM", "System item");

        given()
            .header("Authorization", bearerA)
            .contentType(ContentType.JSON)
            .body(Map.of("name", "Hacked"))
        .when()
            .put(CATALOG + "/items/" + systemItemId)
        .then()
            .statusCode(403)
            .body("code", equalTo("CATALOG_SYSTEM_ITEM_READONLY"));

        given()
            .header("Authorization", bearerA)
        .when()
            .delete(CATALOG + "/items/" + systemItemId)
        .then()
            .statusCode(403)
            .body("code", equalTo("CATALOG_SYSTEM_ITEM_READONLY"));
    }

    @Test
    @DisplayName("AC-15: tenant B cannot read tenant A's items or versions")
    void tenantIsolation() {
        String typeCode = PREFIX + "_ISO_ITEM";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);
        String itemId = createItem(bearerA, typeCode, PREFIX + "_ISO_ITEM_1", "Tenant A item");

        given()
            .header("Authorization", bearerB)
        .when()
            .get(CATALOG + "/items/" + itemId)
        .then()
            .statusCode(404)
            .body("code", equalTo("CATALOG_ITEM_NOT_FOUND"));

        given()
            .header("Authorization", bearerB)
        .when()
            .get(CATALOG + "/items/" + itemId + "/versions")
        .then()
            .statusCode(404)
            .body("code", equalTo("CATALOG_ITEM_NOT_FOUND"));

        given()
            .header("Authorization", bearerB)
            .contentType(ContentType.JSON)
            .body(Map.of("name", "Stolen"))
        .when()
            .put(CATALOG + "/items/" + itemId)
        .then()
            .statusCode(404)
            .body("code", equalTo("CATALOG_ITEM_NOT_FOUND"));
    }
}
