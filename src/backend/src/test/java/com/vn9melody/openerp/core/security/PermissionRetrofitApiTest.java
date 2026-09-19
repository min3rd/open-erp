package com.vn9melody.openerp.core.security;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.resource.DataPolicyResource;
import com.vn9melody.openerp.modules.iam.resource.RoleResource;
import com.vn9melody.openerp.modules.iam.resource.UserRoleResource;
import com.vn9melody.openerp.modules.organization.resource.BranchAssignmentResource;
import com.vn9melody.openerp.modules.organization.resource.BranchResource;
import com.vn9melody.openerp.modules.organization.resource.DepartmentResource;
import com.vn9melody.openerp.modules.organization.resource.MembershipResource;
import com.vn9melody.openerp.modules.core.resource.SampleRecordResource;
import com.vn9melody.openerp.support.S2IamFixtures;
import com.vn9melody.openerp.support.S2IamFixtures.Person;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import java.lang.reflect.Method;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BUG-51 / TASK-267 Wave 3 retrofit: every business endpoint of the IAM and
 * Organization modules enforces its functional permission. STAFF (limited system
 * role) gets {@code 403 IAM_PERMISSION_DENIED_FUNCTIONAL}; TENANT_ADMIN (all
 * permissions) keeps working. Account self-service stays default-allow.
 */
@QuarkusTest
@TestProfile(com.vn9melody.openerp.support.S2IamTestProfile.class)
public class PermissionRetrofitApiTest {

    private static final String ROLES_PATH = "/api/v1/iam/roles";
    private static final String BRANCHES_PATH = "/api/v1/organization/branches";
    private static final String PROFILE_PATH = "/api/v1/account/profile";

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    private String adminBearer;
    private String staffBearer;

    @BeforeEach
    @Transactional
    public void setUp() {
        S2IamFixtures.cleanup();
        Tenant tenant = S2IamFixtures.createTenant("retro");
        Person admin = S2IamFixtures.createUser(tenant.id, "s2iam.retro.admin@example.com", "Retro Admin");
        Person staff = S2IamFixtures.createUser(tenant.id, "s2iam.retro.staff@example.com", "Retro Staff");
        adminBearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, admin, "TENANT_ADMIN");
        staffBearer = S2IamFixtures.bearer(jwtTokenService, sessionManager, staff, "STAFF");
    }

    @Test
    @DisplayName("BUG-51: STAFF gọi API quản trị role bị 403 IAM_PERMISSION_DENIED_FUNCTIONAL kèm quyền yêu cầu")
    public void testStaffDeniedOnRoleApi() {
        given()
            .header("Authorization", staffBearer)
        .when()
            .get(ROLES_PATH)
        .then()
            .statusCode(403)
            .body("success", equalTo(false))
            .body("code", equalTo(ErrorCode.IAM_PERMISSION_DENIED_FUNCTIONAL))
            .body("params.permission", equalTo("core:role:read"));

        given()
            .header("Authorization", staffBearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-NOPE", "name", "Nope"))
        .when()
            .post(BRANCHES_PATH)
        .then()
            .statusCode(403)
            .body("code", equalTo(ErrorCode.IAM_PERMISSION_DENIED_FUNCTIONAL))
            .body("params.required_permission", equalTo("core:branch:manage"));
    }

    @Test
    @DisplayName("BUG-51: TENANT_ADMIN có đủ quyền gọi API IAM/Organization bình thường")
    public void testTenantAdminAllowed() {
        given()
            .header("Authorization", adminBearer)
        .when()
            .get(ROLES_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo("IAM_ROLE_LIST_SUCCESS"));

        given()
            .header("Authorization", adminBearer)
            .contentType(ContentType.JSON)
            .body(Map.of("code", "S2IAM-RETRO1", "name", "Retro Branch"))
        .when()
            .post(BRANCHES_PATH)
        .then()
            .statusCode(201)
            .body("code", equalTo("ORGANIZATION_BRANCH_CREATED_SUCCESS"))
            .body("data.id", notNullValue());
    }

    @Test
    @DisplayName("TASK-267 decision: account self-service vẫn default-allow cho mọi user đã đăng nhập")
    public void testAccountSelfServiceStaysDefaultAllow() {
        given()
            .header("Authorization", staffBearer)
        .when()
            .get(PROFILE_PATH)
        .then()
            .statusCode(200)
            .body("code", equalTo(ErrorCode.ACCOUNT_PROFILE_FETCH_SUCCESS));
    }

    @Test
    @DisplayName("TASK-267 DoD: 100% endpoint core gắn @RequirePermission (trừ self-service có chủ đích)")
    public void testNoCoreEndpointMissesAnnotation() {
        Class<?>[] resources = {
            RoleResource.class,
            UserRoleResource.class,
            DataPolicyResource.class,
            BranchResource.class,
            DepartmentResource.class,
            MembershipResource.class,
            BranchAssignmentResource.class,
            SampleRecordResource.class
        };
        for (Class<?> resource : resources) {
            for (Method method : resource.getDeclaredMethods()) {
                if (!isJaxRsEndpoint(method)) {
                    continue;
                }
                if (resource == DataPolicyResource.class && "myDataScopes".equals(method.getName())) {
                    // Self-service (own effective data scopes), intentionally default-allow.
                    assertTrue(method.getAnnotation(RequirePermission.class) == null);
                    continue;
                }
                assertNotNull(method.getAnnotation(RequirePermission.class),
                    "Missing @RequirePermission on " + resource.getSimpleName() + "#" + method.getName());
            }
        }
    }

    private boolean isJaxRsEndpoint(Method method) {
        return method.isAnnotationPresent(GET.class) || method.isAnnotationPresent(POST.class)
            || method.isAnnotationPresent(PUT.class) || method.isAnnotationPresent(PATCH.class)
            || method.isAnnotationPresent(DELETE.class);
    }
}
