package com.vn9melody.openerp.modules.catalog.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.catalog.model.CatalogItem;
import com.vn9melody.openerp.modules.platform.PlatformTestSupport;
import com.vn9melody.openerp.support.S2IamTestProfile;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import io.restassured.response.ValidatableResponse;
import jakarta.inject.Inject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-390 / AC-18 / AC-19: CSV + .xlsx import (dry-run, per-row errors,
 * parent edges, tenant overrides) and CSV export on the tenant and platform
 * catalog surfaces, against the real PostgreSQL/Redis test environment.
 */
@QuarkusTest
@TestProfile(S2IamTestProfile.class)
public class CatalogImportExportApiTest extends CatalogApiTestBase {

    private static final String TEMPLATE = "code,name,parent_code\n";

    @Inject
    PasswordHashService passwordHashService;

    // ------------------------------------------------------------------
    // Import
    // ------------------------------------------------------------------

    @Test
    @DisplayName("AC-18: CSV import creates missing codes, updates existing ones and round-trips without churn")
    void csvImportCreatesUpdatesAndRoundTrips() {
        String typeCode = PREFIX + "_IMP_CSV";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);
        createItem(bearerA, typeCode, PREFIX + "_IMP_CSV_B", "Old name");

        String csv = TEMPLATE
            + PREFIX + "_IMP_CSV_A,Alpha,\n"
            + PREFIX + "_IMP_CSV_B,Beta,\n";
        importCsv(bearerA, typeCode, false, csv)
            .statusCode(200)
            .body("code", equalTo("CATALOG_IMPORT_SUCCESS"))
            .body("success", equalTo(true))
            .body("data.dry_run", equalTo(false))
            .body("data.total_rows", equalTo(2))
            .body("data.created", equalTo(1))
            .body("data.updated", equalTo(1))
            .body("data.skipped", equalTo(0))
            .body("data.edges_created", equalTo(0))
            .body("data.errors", hasSize(0))
            .body("data.rows[0].action", equalTo("CREATED"))
            .body("data.rows[0].code", equalTo(PREFIX + "_IMP_CSV_A"))
            .body("data.rows[0].errors", hasSize(0))
            .body("data.rows[1].action", equalTo("UPDATED"))
            .body("data.rows[1].errors", hasSize(0));

        given()
            .header("Authorization", bearerA)
            .queryParam("q", PREFIX + "_IMP_CSV_B")
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].version", equalTo(2))
            .body("data.items[0].name", equalTo("Beta"));

        // re-importing the unchanged file is a no-op (no new versions)
        importCsv(bearerA, typeCode, false, csv)
            .statusCode(200)
            .body("data.created", equalTo(0))
            .body("data.updated", equalTo(0))
            .body("data.skipped", equalTo(2))
            .body("data.errors", hasSize(0));

        // exported CSV is importable as-is and stays a no-op (round-trip)
        String exported = new String(exportType(bearerA, typeCode), StandardCharsets.UTF_8);
        importCsv(bearerA, typeCode, false, exported)
            .statusCode(200)
            .body("data.created", equalTo(0))
            .body("data.updated", equalTo(0))
            .body("data.skipped", equalTo(2))
            .body("data.errors", hasSize(0));
    }

    @Test
    @DisplayName("AC-18: dry_run reports the same decisions but writes nothing")
    void dryRunWritesNothing() {
        String typeCode = PREFIX + "_IMP_DRY";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);

        importCsv(bearerA, typeCode, true, TEMPLATE + PREFIX + "_IMP_DRY_1,Dry,\n")
            .statusCode(200)
            .body("data.dry_run", equalTo(true))
            .body("data.created", equalTo(1))
            .body("data.rows[0].action", equalTo("CREATED"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(0))
            .body("data.total_items", equalTo(0));
    }

    @Test
    @DisplayName("AC-18: a malformed header rejects the whole file before any row is written")
    void malformedHeaderRejectedBeforeWriting() {
        String typeCode = PREFIX + "_IMP_HDR";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);

        importCsv(bearerA, typeCode, false, "code,title\n" + PREFIX + "_IMP_HDR_A,Alpha\n")
            .statusCode(400)
            .body("success", equalTo(false))
            .body("code", equalTo("CATALOG_IMPORT_VALIDATION_FAILED"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.total_items", equalTo(0));
    }

    @Test
    @DisplayName("AC-18: per-row errors are reported while valid rows are still written")
    void rowErrorsDoNotBlockValidRows() {
        String typeCode = PREFIX + "_IMP_ROW";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);

        String csv = TEMPLATE
            + PREFIX + "_IMP_ROW_A,Alpha,\n"
            + ",Missing code,\n"
            + PREFIX + "_IMP_ROW_C,Gamma,\n";
        importCsv(bearerA, typeCode, false, csv)
            .statusCode(200)
            .body("data.total_rows", equalTo(3))
            .body("data.created", equalTo(2))
            .body("data.errors", hasSize(1))
            .body("data.errors[0].row", equalTo(3))
            .body("data.errors[0].code", equalTo("CATALOG_IMPORT_ROW_INVALID"))
            .body("data.errors[0].params.field", equalTo("code"))
            .body("data.rows[1].action", equalTo("ERROR"))
            .body("data.rows[1].errors[0].field", equalTo("code"))
            .body("data.rows[1].errors[0].code", equalTo("CATALOG_IMPORT_ROW_INVALID"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.total_items", equalTo(2));
    }

    @Test
    @DisplayName("AC-18: parent_code creates HIERARCHY edges after items exist; a cyclic parent is a row error")
    void parentCodeCreatesEdgesAndCycleIsRowError() {
        String typeCode = PREFIX + "_IMP_EDGE";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);
        String parentId = createItem(bearerA, typeCode, PREFIX + "_IMP_EDGE_P", "Parent");
        String childId = createItem(bearerA, typeCode, PREFIX + "_IMP_EDGE_C", "Child");
        createEdge(bearerA, parentId, childId, "HIERARCHY");

        String csv = TEMPLATE
            + PREFIX + "_IMP_EDGE_C,Child," + PREFIX + "_IMP_EDGE_P" + "\n"
            + PREFIX + "_IMP_EDGE_N,New," + PREFIX + "_IMP_EDGE_P" + "\n"
            + PREFIX + "_IMP_EDGE_P,Parent," + PREFIX + "_IMP_EDGE_C" + "\n";
        importCsv(bearerA, typeCode, false, csv)
            .statusCode(200)
            .body("data.created", equalTo(1))
            .body("data.skipped", equalTo(2))
            .body("data.edges_created", equalTo(1))
            .body("data.errors", hasSize(1))
            .body("data.errors[0].row", equalTo(4))
            .body("data.errors[0].code", equalTo("CATALOG_EDGE_CYCLE"))
            .body("data.rows[2].action", equalTo("SKIPPED"))
            .body("data.rows[2].errors[0].code", equalTo("CATALOG_EDGE_CYCLE"));

        String newItemId = given()
            .header("Authorization", bearerA)
            .queryParam("q", PREFIX + "_IMP_EDGE_N")
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .extract().path("data.items[0].id");

        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/items/" + newItemId + "/parents")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(1))
            .body("data.items[0].code", equalTo(PREFIX + "_IMP_EDGE_P"));

        // the cyclic edge was not created
        given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/items/" + parentId + "/parents")
        .then()
            .statusCode(200)
            .body("data.items", hasSize(0));

        // round-trip: re-importing the export recreates nothing (items and edges already current)
        String exported = new String(exportType(bearerA, typeCode), StandardCharsets.UTF_8);
        importCsv(bearerA, typeCode, false, exported)
            .statusCode(200)
            .body("data.skipped", equalTo(3))
            .body("data.edges_created", equalTo(0))
            .body("data.errors", hasSize(0));
    }

    @Test
    @DisplayName("AC-18: .xlsx import (POI) yields the same result as the equivalent CSV")
    void xlsxImportMatchesCsv() throws IOException {
        String csvType = PREFIX + "_IMP_XLSX_CSV";
        String xlsxType = PREFIX + "_IMP_XLSX_FILE";
        createTenantType(bearerA, csvType, "TREE", List.of("HIERARCHY"), null, null, null);
        createTenantType(bearerA, xlsxType, "TREE", List.of("HIERARCHY"), null, null, null);
        createItem(bearerA, csvType, PREFIX + "_IMP_XLSX_B", "Old name");
        createItem(bearerA, xlsxType, PREFIX + "_IMP_XLSX_B", "Old name");

        String csv = TEMPLATE
            + PREFIX + "_IMP_XLSX_A,Alpha,\n"
            + PREFIX + "_IMP_XLSX_B,Beta,\n";
        importCsv(bearerA, csvType, false, csv)
            .statusCode(200)
            .body("data.created", equalTo(1))
            .body("data.updated", equalTo(1));

        byte[] xlsx = xlsx(
            "code,name,parent_code",
            PREFIX + "_IMP_XLSX_A,Alpha,",
            PREFIX + "_IMP_XLSX_B,Beta,");
        importXlsx(bearerA, xlsxType, false, xlsx)
            .statusCode(200)
            .body("code", equalTo("CATALOG_IMPORT_SUCCESS"))
            .body("data.total_rows", equalTo(2))
            .body("data.created", equalTo(1))
            .body("data.updated", equalTo(1))
            .body("data.errors", hasSize(0));

        given()
            .header("Authorization", bearerA)
            .queryParam("q", PREFIX + "_IMP_XLSX_B")
        .when()
            .get(CATALOG + "/types/" + xlsxType + "/items")
        .then()
            .statusCode(200)
            .body("data.items[0].version", equalTo(2))
            .body("data.items[0].name", equalTo("Beta"));
    }

    @Test
    @DisplayName("TASK-391: a tenant importing a system code creates its own override row, never touching the system row")
    void tenantImportOfSystemCodeCreatesOverride() {
        String typeCode = PREFIX + "_IMP_SYS";
        UUID systemTypeId = createSystemType(typeCode, CatalogHierarchyMode.TREE);
        UUID systemItemId = createSystemItem(systemTypeId, PREFIX + "_IMP_SYS_1", "System name");

        importCsv(bearerA, typeCode, false, TEMPLATE + PREFIX + "_IMP_SYS_1,Tenant name,\n")
            .statusCode(200)
            .body("data.created", equalTo(1));

        given()
            .header("Authorization", bearerA)
            .queryParam("q", PREFIX + "_IMP_SYS_1")
        .when()
            .get(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(200)
            .body("data.items.find { it.is_system == false }.name", equalTo("Tenant name"))
            .body("data.items.find { it.is_system == false }.overridden", equalTo(true))
            .body("data.items.find { it.is_system == true }.name", equalTo("System name"));

        String systemName = QuarkusTransaction.requiringNew()
            .call(() -> ((CatalogItem) CatalogItem.findById(systemItemId)).name);
        assertEquals("System name", systemName);
    }

    // ------------------------------------------------------------------
    // Template / export
    // ------------------------------------------------------------------

    @Test
    @DisplayName("AC-19: the import template is UTF-8 BOM CSV with the exact columns")
    void importTemplateHasBomAndColumns() {
        String typeCode = PREFIX + "_IMP_TPL";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);

        byte[] template = given()
            .header("Authorization", bearerA)
        .when()
            .get(CATALOG + "/types/" + typeCode + "/import/template")
        .then()
            .statusCode(200)
            .header("Content-Type", containsString("text/csv"))
            .extract().asByteArray();

        assertBom(template);
        assertEquals("code,name,parent_code\r\n", new String(template, StandardCharsets.UTF_8).substring(1));
    }

    @Test
    @DisplayName("AC-19: export is UTF-8 BOM CSV honouring type/q/status/all filters and parent links")
    void exportHonoursFiltersAndIncludesParents() {
        String typeCode = PREFIX + "_IMP_EXP";
        createTenantType(bearerA, typeCode, "TREE", List.of("HIERARCHY"), null, null, null);
        String parentId = createItem(bearerA, typeCode, PREFIX + "_IMP_EXP_P", "Parent, with comma");
        String childId = createItem(bearerA, typeCode, PREFIX + "_IMP_EXP_C", "Child");
        createEdge(bearerA, parentId, childId, "HIERARCHY");

        byte[] bytes = exportType(bearerA, typeCode);
        assertBom(bytes);
        String text = new String(bytes, StandardCharsets.UTF_8).substring(1);
        String[] lines = text.split("\r\n");
        assertEquals("type_code,code,name,parent_code,status,valid_from,valid_to,version", lines[0]);

        String childLine = Arrays.stream(lines)
            .filter(line -> line.startsWith(typeCode + "," + PREFIX + "_IMP_EXP_C,")).findFirst().orElseThrow();
        assertTrue(childLine.startsWith(typeCode + "," + PREFIX + "_IMP_EXP_C,Child,"
            + PREFIX + "_IMP_EXP_P,ACTIVE,"), childLine);
        String parentLine = Arrays.stream(lines)
            .filter(line -> line.startsWith(typeCode + "," + PREFIX + "_IMP_EXP_P,")).findFirst().orElseThrow();
        assertTrue(parentLine.startsWith(typeCode + "," + PREFIX + "_IMP_EXP_P,\"Parent, with comma\",,ACTIVE,"),
            parentLine);

        String filtered = new String(exportQuery(bearerA, "type_code=" + typeCode + "&q=" + PREFIX + "_IMP_EXP_C"),
            StandardCharsets.UTF_8);
        assertTrue(filtered.contains(PREFIX + "_IMP_EXP_C"));
        assertFalse(filtered.contains(typeCode + "," + PREFIX + "_IMP_EXP_P,"));

        String inactive = new String(exportQuery(bearerA, "type_code=" + typeCode + "&status=INACTIVE"),
            StandardCharsets.UTF_8);
        assertEquals(1, inactive.split("\r\n").length);

        String all = new String(exportQuery(bearerA, "all=true"), StandardCharsets.UTF_8);
        assertTrue(all.contains(typeCode + "," + PREFIX + "_IMP_EXP_C"));
    }

    // ------------------------------------------------------------------
    // Platform surface
    // ------------------------------------------------------------------

    @Test
    @DisplayName("TASK-392: tenant tokens cannot reach the system import/export endpoints")
    void systemEndpointsRejectTenantTokens() {
        given()
            .header("Authorization", bearerA)
            .multiPart("file", "catalog.csv", TEMPLATE.getBytes(StandardCharsets.UTF_8), "text/csv")
        .when()
            .post("/api/v1/catalog/system/types/PROVINCE/import")
        .then()
            .statusCode(403)
            .body("code", equalTo("PLATFORM_ACCESS_DENIED"));

        given()
            .header("Authorization", bearerA)
        .when()
            .get("/api/v1/catalog/system/export")
        .then()
            .statusCode(403)
            .body("code", equalTo("PLATFORM_ACCESS_DENIED"));
    }

    @Test
    @DisplayName("TASK-392/390: a platform admin imports and exports the system catalogue")
    void platformSystemImportExport() {
        String typeCode = PREFIX + "_IMP_PLAT";
        try {
            QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
            createSystemType(typeCode, CatalogHierarchyMode.TREE);
            String email = "s2plat-catalog-import@example.com";
            QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.createPlatformAdmin(
                email, PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService));
            String token = given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", PlatformTestSupport.PASSWORD))
            .when()
                .post("/api/v1/auth/login")
            .then()
                .statusCode(200)
                .extract().path("data.access_token");
            String platformBearer = "Bearer " + token;

            String csv = TEMPLATE
                + PREFIX + "_IMP_PLAT_P,System parent,\n"
                + PREFIX + "_IMP_PLAT_C,System child," + PREFIX + "_IMP_PLAT_P\n";
            given()
                .header("Authorization", platformBearer)
                .multiPart("file", "catalog.csv", csv.getBytes(StandardCharsets.UTF_8), "text/csv")
            .when()
                .post("/api/v1/catalog/system/types/" + typeCode + "/import")
            .then()
                .statusCode(200)
                .body("data.created", equalTo(2))
                .body("data.edges_created", equalTo(1))
                .body("data.errors", hasSize(0));

            given()
                .header("Authorization", platformBearer)
            .when()
                .get("/api/v1/catalog/system/types/" + typeCode + "/items")
            .then()
                .statusCode(200)
                .body("data.items", hasSize(2));

            byte[] exported = given()
                .header("Authorization", platformBearer)
                .queryParam("type_code", typeCode)
            .when()
                .get("/api/v1/catalog/system/export")
            .then()
                .statusCode(200)
                .extract().asByteArray();
            String text = new String(exported, StandardCharsets.UTF_8);
            assertTrue(text.contains(PREFIX + "_IMP_PLAT_C,System child," + PREFIX + "_IMP_PLAT_P"));
        } finally {
            QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private ValidatableResponse importCsv(String bearer, String typeCode, boolean dryRun, String csv) {
        return given()
            .header("Authorization", bearer)
            .multiPart("file", "catalog.csv", csv.getBytes(StandardCharsets.UTF_8), "text/csv")
            .queryParam("dry_run", dryRun)
        .when()
            .post(CATALOG + "/types/" + typeCode + "/import")
        .then();
    }

    private ValidatableResponse importXlsx(String bearer, String typeCode, boolean dryRun, byte[] content) {
        return given()
            .header("Authorization", bearer)
            .multiPart("file", "catalog.xlsx", content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            .queryParam("dry_run", dryRun)
        .when()
            .post(CATALOG + "/types/" + typeCode + "/import")
        .then();
    }

    private byte[] exportType(String bearer, String typeCode) {
        return given()
            .header("Authorization", bearer)
            .queryParam("type_code", typeCode)
        .when()
            .get(CATALOG + "/export")
        .then()
            .statusCode(200)
            .extract().asByteArray();
    }

    private byte[] exportQuery(String bearer, String query) {
        return given()
            .header("Authorization", bearer)
        .when()
            .get(CATALOG + "/export?" + query)
        .then()
            .statusCode(200)
            .extract().asByteArray();
    }

    private static void assertBom(byte[] bytes) {
        assertTrue(bytes.length > 3, "payload must not be empty");
        assertEquals((byte) 0xEF, bytes[0]);
        assertEquals((byte) 0xBB, bytes[1]);
        assertEquals((byte) 0xBF, bytes[2]);
    }

    private static byte[] xlsx(String... lines) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("catalog");
            for (int rowIndex = 0; rowIndex < lines.length; rowIndex++) {
                Row row = sheet.createRow(rowIndex);
                String[] cells = lines[rowIndex].split(",", -1);
                for (int cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                    row.createCell(cellIndex).setCellValue(cells[cellIndex]);
                }
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
