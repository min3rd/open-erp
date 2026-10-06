package com.vn9melody.openerp.modules.catalog.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.catalog.CatalogTestFixtures;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;

/**
 * Shared fixtures for the Sprint 05 catalog REST tests: two tenants, an admin per
 * tenant and a viewer, plus helpers for tenant/system catalog data. Every row is
 * prefixed ({@code S2CAT}) so cleanup never touches migration-seeded data.
 */
public abstract class CatalogApiTestBase {

    protected static final String CATALOG = "/api/v1/catalog";
    protected static final String PREFIX = CatalogTestFixtures.PREFIX;

    @Inject
    protected JwtTokenService jwtTokenService;

    @Inject
    protected SessionManager sessionManager;

    @Inject
    protected EntityManager entityManager;

    protected Tenant tenantA;
    protected Tenant tenantB;
    protected Person adminA;
    protected Person adminB;
    protected Person viewerA;
    protected String bearerA;
    protected String bearerB;
    protected String viewerBearerA;

    @BeforeEach
    @Transactional
    void setUpCatalogApi() {
        CatalogTestFixtures.cleanup(entityManager);
        S2IamFixtures.cleanup();
        tenantA = S2IamFixtures.createTenant("catalog-a");
        tenantB = S2IamFixtures.createTenant("catalog-b");
        adminA = S2IamFixtures.createUser(tenantA.id, "s2iam.catalog.a@example.com", "Catalog Admin A");
        adminB = S2IamFixtures.createUser(tenantB.id, "s2iam.catalog.b@example.com", "Catalog Admin B");
        viewerA = S2IamFixtures.createUser(tenantA.id, "s2iam.catalog.viewer@example.com", "Catalog Viewer A");
        bearerA = S2IamFixtures.bearer(jwtTokenService, sessionManager, adminA, "TENANT_ADMIN");
        bearerB = S2IamFixtures.bearer(jwtTokenService, sessionManager, adminB, "TENANT_ADMIN");
        viewerBearerA = S2IamFixtures.bearer(jwtTokenService, sessionManager, viewerA, "VIEWER");
    }

    @AfterEach
    @Transactional
    void tearDownCatalogApi() {
        CatalogTestFixtures.cleanup(entityManager);
        S2IamFixtures.cleanup();
    }

    /** Creates a tenant type through the API (also exercises the default grant). */
    protected String createTenantType(String bearer, String code, String mode, List<String> relations,
                                      List<String> parentTypes, Boolean freeText, Integer minParents) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", code);
        body.put("name_key", "CATALOG_TYPE_" + code);
        body.put("hierarchy_mode", mode);
        if (relations != null) {
            body.put("allowed_relations", relations);
        }
        if (parentTypes != null) {
            body.put("allowed_parent_types", parentTypes);
        }
        if (freeText != null) {
            body.put("allow_free_text", freeText);
        }
        if (minParents != null) {
            body.put("min_parents", minParents);
        }
        return given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(body)
        .when()
            .post(CATALOG + "/types")
        .then()
            .statusCode(201)
            .body("code", equalTo("CATALOG_TYPE_CREATED_SUCCESS"))
        .extract().path("data.id");
    }

    protected String createItem(String bearer, String typeCode, String code, String name) {
        return given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", code, "name", name))
        .when()
            .post(CATALOG + "/types/" + typeCode + "/items")
        .then()
            .statusCode(201)
            .body("code", equalTo("CATALOG_ITEM_CREATED_SUCCESS"))
        .extract().path("data.id");
    }

    protected String createEdge(String bearer, String parentItemId, String childItemId, String relationType) {
        Map<String, Object> body = new HashMap<>();
        body.put("parent_item_id", parentItemId);
        body.put("child_item_id", childItemId);
        body.put("relation_type", relationType);
        return given()
            .header("Authorization", bearer)
            .contentType(ContentType.JSON)
            .body(body)
        .when()
            .post(CATALOG + "/edges")
        .then()
            .statusCode(201)
            .body("code", equalTo("CATALOG_EDGE_CREATED_SUCCESS"))
        .extract().path("data.id");
    }

    // ------------------------------------------------------------------
    // Committed system fixtures (visible to REST calls in their own transaction)
    // ------------------------------------------------------------------

    protected UUID createSystemType(String code, CatalogHierarchyMode mode) {
        return QuarkusTransaction.requiringNew().call(() -> CatalogTestFixtures.createSystemType(code, mode).id);
    }

    protected UUID createSystemItem(UUID typeId, String code, String name) {
        return QuarkusTransaction.requiringNew().call(() -> CatalogTestFixtures
            .createItem(null, typeId, code, name, Instant.now().minusSeconds(60), null).id);
    }
}
