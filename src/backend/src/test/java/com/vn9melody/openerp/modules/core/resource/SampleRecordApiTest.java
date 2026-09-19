package com.vn9melody.openerp.modules.core.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-283/284 + TASK-290: end-to-end REST tests of the reference entity API:
 * scope matrix (OWN_ONLY, BRANCH union, NONE, ALL), CRUD, share, soft delete and
 * export on real PostgreSQL and Redis.
 */
@QuarkusTest
public class SampleRecordApiTest {

    private static final String BASE_PATH = "/api/v1/core/sample-records";
    private static final String RESOURCE = "CORE_SAMPLE_RECORD";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SecurityContextService securityContextService;

    @Inject
    EntityManager em;

    private String suffix;
    private UUID tenantId;
    private UUID operatorId;
    private UUID managerId;
    private UUID otherUserId;
    private UUID outsiderId;
    private UUID hnBranchId;
    private UUID hcmBranchId;
    private UUID dnBranchId;
    private UUID hnRootDepartmentId;
    private UUID hnChildDepartmentId;
    private UUID dnDepartmentId;
    private UUID hnRecordId;
    private UUID hcmRecordId;
    private UUID childRecordId;
    private UUID dnRecordId;

    private String operatorToken;
    private String managerToken;
    private String outsiderToken;

    @BeforeEach
    @Transactional
    public void setup() {
        suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        operatorId = S2EngineFixtures.insertUser(em, "op-" + suffix);
        managerId = S2EngineFixtures.insertUser(em, "mgr-" + suffix);
        otherUserId = S2EngineFixtures.insertUser(em, "other-" + suffix);
        outsiderId = S2EngineFixtures.insertUser(em, "out-" + suffix);
        for (UUID userId : new UUID[]{operatorId, managerId, otherUserId, outsiderId}) {
            S2EngineFixtures.insertUserTenant(em, userId, tenantId, "MEMBER");
        }

        UUID operatorRole = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-op");
        for (String permission : new String[]{
            "core:sample-record:read", "core:sample-record:create", "core:sample-record:update",
            "core:sample-record:delete", "core:sample-record:export", "core:sample-record:share"}) {
            S2EngineFixtures.grantPermission(em, operatorRole, permission);
        }
        S2EngineFixtures.assignRole(em, operatorId, tenantId, operatorRole);
        S2EngineFixtures.upsertPolicy(em, tenantId, operatorRole, RESOURCE,
            DataScope.OWN_ONLY, DataScope.OWN_ONLY, DataScope.OWN_ONLY,
            DataScope.OWN_ONLY, DataScope.OWN_ONLY, DataScope.OWN_ONLY);

        UUID managerRole = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-mgr");
        for (String permission : new String[]{
            "core:sample-record:read", "core:sample-record:export", "core:sample-record:share"}) {
            S2EngineFixtures.grantPermission(em, managerRole, permission);
        }
        S2EngineFixtures.assignRole(em, managerId, tenantId, managerRole);
        S2EngineFixtures.upsertPolicy(em, tenantId, managerRole, RESOURCE,
            DataScope.BRANCH, DataScope.BRANCH, DataScope.NONE,
            DataScope.NONE, DataScope.BRANCH, DataScope.NONE);

        UUID outsiderRole = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-out");
        S2EngineFixtures.grantPermission(em, outsiderRole, "core:sample-record:read");
        S2EngineFixtures.grantPermission(em, outsiderRole, "core:sample-record:export");
        S2EngineFixtures.assignRole(em, outsiderId, tenantId, outsiderRole);
        S2EngineFixtures.upsertPolicy(em, tenantId, outsiderRole, RESOURCE,
            DataScope.NONE, DataScope.NONE, DataScope.NONE,
            DataScope.NONE, DataScope.NONE, DataScope.NONE);

        hnBranchId = S2EngineFixtures.insertBranch(em, tenantId, "BR-HN-" + suffix);
        hcmBranchId = S2EngineFixtures.insertBranch(em, tenantId, "BR-HCM-" + suffix);
        dnBranchId = S2EngineFixtures.insertBranch(em, tenantId, "BR-DN-" + suffix);
        hnRootDepartmentId = S2EngineFixtures.insertDepartment(em, tenantId, hnBranchId, null, "KD-" + suffix, null);
        hnChildDepartmentId = S2EngineFixtures.insertDepartment(em, tenantId, hnBranchId, hnRootDepartmentId, "KD-B2B-" + suffix, null);
        dnDepartmentId = S2EngineFixtures.insertDepartment(em, tenantId, dnBranchId, null, "KT-" + suffix, null);

        S2EngineFixtures.insertMembership(em, operatorId, tenantId, hnBranchId, hnRootDepartmentId, true, null);
        S2EngineFixtures.insertMembership(em, managerId, tenantId, hnBranchId, hnRootDepartmentId, true, null);
        S2EngineFixtures.insertMembership(em, otherUserId, tenantId, hnBranchId, hnChildDepartmentId, true, null);
        S2EngineFixtures.insertMembership(em, outsiderId, tenantId, dnBranchId, dnDepartmentId, true, null);
        S2EngineFixtures.insertBranchAssignment(em, managerId, tenantId, hnBranchId, true, false);
        S2EngineFixtures.insertBranchAssignment(em, managerId, tenantId, hcmBranchId, false, true);

        hnRecordId = S2EngineFixtures.insertSampleRecord(em, tenantId, hnBranchId, hnRootDepartmentId,
            operatorId, null, S2EngineFixtures.PREFIX + "hn-record-" + suffix, "ACTIVE");
        hcmRecordId = S2EngineFixtures.insertSampleRecord(em, tenantId, hcmBranchId, null,
            otherUserId, null, S2EngineFixtures.PREFIX + "hcm-record-" + suffix, "ACTIVE");
        childRecordId = S2EngineFixtures.insertSampleRecord(em, tenantId, hnBranchId, hnChildDepartmentId,
            otherUserId, null, S2EngineFixtures.PREFIX + "child-record-" + suffix, "ACTIVE");
        dnRecordId = S2EngineFixtures.insertSampleRecord(em, tenantId, dnBranchId, dnDepartmentId,
            outsiderId, null, S2EngineFixtures.PREFIX + "dn-record-" + suffix, "ACTIVE");

        operatorToken = mintToken(operatorId, "op-" + suffix);
        managerToken = mintToken(managerId, "mgr-" + suffix);
        outsiderToken = mintToken(outsiderId, "out-" + suffix);
        securityContextService.invalidate(tenantId, operatorId);
        securityContextService.invalidate(tenantId, managerId);
        securityContextService.invalidate(tenantId, outsiderId);
    }

    /**
     * Removes the reference rows created by this test so global fixtures of other
     * suites (e.g. AccountServiceTest wiping users) never hit the created_by FK.
     */
    @AfterEach
    @Transactional
    public void cleanup() {
        if (tenantId != null) {
            em.createNativeQuery("DELETE FROM core_sample_records WHERE tenant_id = ?1")
                .setParameter(1, tenantId)
                .executeUpdate();
        }
    }

    @Test
    @DisplayName("TASK-290: OWN_ONLY chỉ trả bản ghi của chính mình")
    public void testOwnOnlyList() {
        given()
            .header("Authorization", "Bearer " + operatorToken)
        .when()
            .get(BASE_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.CORE_SAMPLE_RECORD_LIST_SUCCESS))
            .body("data.total_items", equalTo(1))
            .body("data.items[0].id", equalTo(hnRecordId.toString()))
            .body("data.items.id", not(hasItem(hcmRecordId.toString())));
    }

    @Test
    @DisplayName("TASK-290 TC-BE-21: BRANCH hợp nhất member (HN) + managed (HCM), không rò rỉ DN")
    public void testBranchUnionList() {
        given()
            .header("Authorization", "Bearer " + managerToken)
        .when()
            .get(BASE_PATH)
        .then()
            .statusCode(200)
            .body("data.total_items", equalTo(3))
            .body("data.items.id", hasItem(hnRecordId.toString()))
            .body("data.items.id", hasItem(hcmRecordId.toString()))
            .body("data.items.id", hasItem(childRecordId.toString()))
            .body("data.items.id", not(hasItem(dnRecordId.toString())));
    }

    @Test
    @DisplayName("TASK-290: NONE deny list rỗng, chi tiết 403 DATA_SCOPE, export 403 EXPORT")
    public void testNoneScopeDeniesReadAndExport() {
        given()
            .header("Authorization", "Bearer " + outsiderToken)
        .when()
            .get(BASE_PATH)
        .then()
            .statusCode(200)
            .body("data.total_items", equalTo(0));

        given()
            .header("Authorization", "Bearer " + outsiderToken)
        .when()
            .get(BASE_PATH + "/" + dnRecordId)
        .then()
            .statusCode(403)
            .body("code", equalTo(ErrorCode.IAM_PERMISSION_DENIED_DATA_SCOPE));

        given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + outsiderToken)
            .body(Map.of())
        .when()
            .post(BASE_PATH + "/export")
        .then()
            .statusCode(403)
            .body("code", equalTo(ErrorCode.IAM_PERMISSION_DENIED_EXPORT));
    }

    @Test
    @DisplayName("TASK-290 TC-BE-22: CREATE mặc định primary branch, update/delete luồng đầy đủ")
    public void testCreateUpdateDeleteFlow() {
        String title = S2EngineFixtures.PREFIX + "created-" + suffix;
        String createdId = given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + operatorToken)
            .body(createBody(title, 55))
        .when()
            .post(BASE_PATH)
        .then()
            .statusCode(201)
            .body("code", equalTo(ErrorCode.CORE_SAMPLE_RECORD_CREATED))
            .body("data.title", equalTo(title))
            .body("data.branch_id", equalTo(hnBranchId.toString()))
            .body("data.department_id", equalTo(hnRootDepartmentId.toString()))
            .body("data.created_by", equalTo(operatorId.toString()))
            .extract().path("data.id");

        given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + operatorToken)
            .body(Map.of("title", title + "-updated", "amount", 77))
        .when()
            .patch(BASE_PATH + "/" + createdId)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.CORE_SAMPLE_RECORD_UPDATED))
            .body("data.title", equalTo(title + "-updated"));

        given()
            .header("Authorization", "Bearer " + operatorToken)
        .when()
            .delete(BASE_PATH + "/" + createdId)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.CORE_SAMPLE_RECORD_DELETED))
            .body("data.status", equalTo("ARCHIVED"));

        String archivedStatus = io.quarkus.narayana.jta.QuarkusTransaction.requiringNew().call(() ->
            (String) em.createNativeQuery("SELECT status FROM core_sample_records WHERE id = :id")
                .setParameter("id", UUID.fromString(createdId))
                .getSingleResult());
        Assertions.assertEquals("ARCHIVED", archivedStatus, "DELETE phải soft delete (ARCHIVED)");

        given()
            .header("Authorization", "Bearer " + operatorToken)
        .when()
            .get(BASE_PATH)
        .then()
            .statusCode(200)
            .body("data.items.id", not(hasItem(createdId)));
    }

    @Test
    @DisplayName("TASK-284: share theo share_scope, ngoài scope trả 403 DATA_SCOPE")
    public void testShareScope() {
        given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + operatorToken)
            .body(Map.of("assignee_id", otherUserId.toString()))
        .when()
            .post(BASE_PATH + "/" + hnRecordId + "/share")
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.CORE_SAMPLE_RECORD_SHARED))
            .body("data.assignee_id", equalTo(otherUserId.toString()));

        given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + managerToken)
            .body(Map.of("assignee_id", otherUserId.toString()))
        .when()
            .post(BASE_PATH + "/" + hnRecordId + "/share")
        .then()
            .statusCode(403)
            .body("code", equalTo(ErrorCode.IAM_PERMISSION_DENIED_DATA_SCOPE));
    }

    @Test
    @DisplayName("TASK-284: export theo export_scope trả metadata + file CSV")
    public void testExportScope() {
        given()
            .contentType(ContentType.JSON)
            .header("Authorization", "Bearer " + managerToken)
            .body(Map.of())
        .when()
            .post(BASE_PATH + "/export")
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.CORE_SAMPLE_RECORD_EXPORTED))
            .body("data.total_records", equalTo(3))
            .body("data.file_url", not(nullValue()))
            .body("data.download_url", not(nullValue()));

        given()
            .header("Authorization", "Bearer " + managerToken)
        .when()
            .get(BASE_PATH + "/export?format=csv")
        .then()
            .statusCode(200)
            .body(containsString(S2EngineFixtures.PREFIX + "hn-record-" + suffix))
            .body(not(containsString(S2EngineFixtures.PREFIX + "dn-record-" + suffix)));
    }

    @Test
    @DisplayName("TASK-284: truy cập bản ghi ngoài phạm vi theo id trả 403 DATA_SCOPE")
    public void testGetOutsideScopeDenied() {
        given()
            .header("Authorization", "Bearer " + operatorToken)
        .when()
            .get(BASE_PATH + "/" + dnRecordId)
        .then()
            .statusCode(403)
            .body("code", equalTo(ErrorCode.IAM_PERMISSION_DENIED_DATA_SCOPE));
    }

    private Map<String, Object> createBody(String title, int amount) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("amount", amount);
        return body;
    }

    private String mintToken(UUID userId, String emailSuffix) {
        return jwtTokenService.generateAccessToken(
            userId, S2EngineFixtures.PREFIX + emailSuffix + "@example.com", tenantId, "STAFF",
            UUID.randomUUID().toString());
    }
}
