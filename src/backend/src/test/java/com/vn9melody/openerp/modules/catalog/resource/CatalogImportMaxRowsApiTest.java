package com.vn9melody.openerp.modules.catalog.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-390: the row limit is configuration-driven
 * ({@code openerp.catalog.import.max-rows}); this suite pins it to 2 so the guard
 * is exercised without generating 20.000 rows.
 */
@QuarkusTest
@TestProfile(CatalogImportMaxRowsApiTest.MaxRowsProfile.class)
public class CatalogImportMaxRowsApiTest extends CatalogApiTestBase {

    /** Same test infrastructure as the shared profile, with a tiny import limit. */
    public static class MaxRowsProfile extends S2IamTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            Map<String, String> overrides = new HashMap<>(super.getConfigOverrides());
            overrides.put("openerp.catalog.import.max-rows", "2");
            return overrides;
        }
    }

    @Test
    @DisplayName("AC-18: exceeding openerp.catalog.import.max-rows fails the file before any write")
    void rejectsFileOverConfiguredRowLimit() {
        String typeCode = PREFIX + "_IMP_MAX";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);

        String csv = "code,name,parent_code\n"
            + PREFIX + "_IMP_MAX_1,One,\n"
            + PREFIX + "_IMP_MAX_2,Two,\n"
            + PREFIX + "_IMP_MAX_3,Three,\n";
        given()
            .header("Authorization", bearerA)
            .multiPart("file", "catalog.csv", csv.getBytes(StandardCharsets.UTF_8), "text/csv")
        .when()
            .post(CATALOG + "/types/" + typeCode + "/import")
        .then()
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo("CATALOG_IMPORT_TOO_LARGE"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.total_items", equalTo(0));
    }
}
