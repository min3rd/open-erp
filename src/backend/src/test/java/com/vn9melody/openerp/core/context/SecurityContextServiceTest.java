package com.vn9melody.openerp.core.context;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.core.security.events.BranchAssignmentChangedEvent;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-288/290: security context resolution on real PostgreSQL + Redis:
 * roles/permissions, most-permissive data policies, branch union, department
 * subtree, subordinate reporting line, tenant guards and cache invalidation.
 */
@QuarkusTest
public class SecurityContextServiceTest {

    private static final String RESOURCE = "CORE_SAMPLE_RECORD";
    private static final String PERM_READ = "core:sample-record:read";
    private static final String PERM_CREATE = "core:sample-record:create";
    private static final String PERM_UPDATE = "core:sample-record:update";

    @Inject
    SecurityContextService securityContextService;

    @Inject
    com.vn9melody.openerp.core.security.PermissionInvalidationService permissionInvalidationService;

    @Inject
    RedisDataSource redis;

    @Inject
    EntityManager em;

    private String suffix;
    private UUID tenantId;
    private UUID managerUserId;
    private UUID reportingSubordinateId;
    private UUID departmentSubordinateId;
    private UUID hnBranchId;
    private UUID hcmBranchId;
    private UUID dnBranchId;
    private UUID rootDepartmentId;
    private UUID childDepartmentId;
    private UUID siblingDepartmentId;
    private UUID roleId;
    private UUID roleId2;

    @BeforeEach
    @Transactional
    public void setup() {
        suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        managerUserId = S2EngineFixtures.insertUserWithProfile(em, "mgr-" + suffix, "Regional Manager");
        reportingSubordinateId = S2EngineFixtures.insertUser(em, "rep-" + suffix);
        departmentSubordinateId = S2EngineFixtures.insertUser(em, "dept-" + suffix);
        S2EngineFixtures.insertUserTenant(em, managerUserId, tenantId, "ADMIN");
        S2EngineFixtures.insertUserTenant(em, reportingSubordinateId, tenantId, "MEMBER");
        S2EngineFixtures.insertUserTenant(em, departmentSubordinateId, tenantId, "MEMBER");

        roleId = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-a");
        roleId2 = S2EngineFixtures.insertCustomRole(em, tenantId, suffix + "-b");
        S2EngineFixtures.grantPermission(em, roleId, PERM_READ);
        S2EngineFixtures.grantPermission(em, roleId, PERM_CREATE);
        S2EngineFixtures.grantPermission(em, roleId, PERM_UPDATE);
        S2EngineFixtures.grantPermission(em, roleId2, PERM_READ);
        S2EngineFixtures.assignRole(em, managerUserId, tenantId, roleId);
        S2EngineFixtures.assignRole(em, managerUserId, tenantId, roleId2);
        S2EngineFixtures.upsertPolicy(em, tenantId, roleId, RESOURCE,
            DataScope.BRANCH, DataScope.OWN_ONLY, DataScope.BRANCH, DataScope.NONE, DataScope.BRANCH, DataScope.NONE);
        S2EngineFixtures.upsertPolicy(em, tenantId, roleId2, RESOURCE,
            DataScope.OWN_ONLY, DataScope.BRANCH, DataScope.OWN_ONLY, DataScope.NONE, DataScope.NONE, DataScope.NONE);

        hnBranchId = S2EngineFixtures.insertBranch(em, tenantId, "BR-HN-" + suffix);
        hcmBranchId = S2EngineFixtures.insertBranch(em, tenantId, "BR-HCM-" + suffix);
        dnBranchId = S2EngineFixtures.insertBranch(em, tenantId, "BR-DN-" + suffix);
        rootDepartmentId = S2EngineFixtures.insertDepartment(em, tenantId, hnBranchId, null, "KD-" + suffix, managerUserId);
        childDepartmentId = S2EngineFixtures.insertDepartment(em, tenantId, hnBranchId, rootDepartmentId, "KD-B2B-" + suffix, null);
        siblingDepartmentId = S2EngineFixtures.insertDepartment(em, tenantId, dnBranchId, null, "KT-" + suffix, null);

        S2EngineFixtures.insertMembership(em, managerUserId, tenantId, hnBranchId, rootDepartmentId, true, null);
        S2EngineFixtures.insertMembership(em, reportingSubordinateId, tenantId, hnBranchId, rootDepartmentId, true, managerUserId);
        S2EngineFixtures.insertMembership(em, departmentSubordinateId, tenantId, hnBranchId, childDepartmentId, true, null);
        S2EngineFixtures.insertBranchAssignment(em, managerUserId, tenantId, hnBranchId, true, false);
        S2EngineFixtures.insertBranchAssignment(em, managerUserId, tenantId, hcmBranchId, false, true);

        securityContextService.invalidate(tenantId, managerUserId);
    }

    @Test
    @Transactional
    @DisplayName("TASK-288: build context đủ role, quyền, policy, branch union, subtree và cấp dưới")
    public void testBuildContextResolvesEveryDimension() {
        UserSecurityContext context = securityContextService.buildContext(tenantId, managerUserId);

        Assertions.assertEquals(tenantId, context.tenantId());
        Assertions.assertEquals(managerUserId, context.userId());
        Assertions.assertTrue(context.roleIds().containsAll(List.of(roleId, roleId2)));
        Assertions.assertTrue(context.functionalPermissions().contains(PERM_READ));
        Assertions.assertTrue(context.functionalPermissions().contains(PERM_CREATE));
        Assertions.assertTrue(context.functionalPermissions().contains(PERM_UPDATE));
        Assertions.assertFalse(context.isTenantOwner());

        Assertions.assertEquals(DataScope.BRANCH, context.explicitScopeFor(RESOURCE, DataOperation.READ));
        Assertions.assertEquals(DataScope.NONE, context.explicitScopeFor(RESOURCE, DataOperation.DELETE));

        Assertions.assertEquals(hnBranchId, context.primaryBranchId());
        Assertions.assertTrue(context.memberBranchIds().contains(hnBranchId));
        Assertions.assertTrue(context.managedBranchIds().contains(hcmBranchId));
        Assertions.assertEquals(Set.of(hnBranchId, hcmBranchId), context.effectiveBranchIds());
        Assertions.assertFalse(context.effectiveBranchIds().contains(dnBranchId));

        Assertions.assertEquals(rootDepartmentId, context.departmentId());
        Assertions.assertTrue(context.departmentAndChildIds().contains(rootDepartmentId));
        Assertions.assertTrue(context.departmentAndChildIds().contains(childDepartmentId));
        Assertions.assertFalse(context.departmentAndChildIds().contains(siblingDepartmentId));

        Assertions.assertTrue(context.subordinateUserIds().contains(reportingSubordinateId),
            "direct_manager_user_id reporting line phải được đệ quy");
        Assertions.assertTrue(context.subordinateUserIds().contains(departmentSubordinateId),
            "thành viên phòng ban do user làm trưởng phải là cấp dưới");
        Assertions.assertFalse(context.subordinateUserIds().contains(managerUserId));
    }

    @Test
    @Transactional
    @DisplayName("TASK-290 TC-BE-23: cache Redis sec:ctx:{tenant}:{user} + xóa cache khi nhận invalidation")
    public void testCacheRoundTripAndPubSubInvalidation() throws InterruptedException {
        String key = securityContextService.contextKey(tenantId, managerUserId);
        UserSecurityContext fresh = securityContextService.getContext(tenantId, managerUserId);
        Assertions.assertNotNull(redis.value(String.class).get(key), "Context phải được cache vào Redis");

        UserSecurityContext cached = securityContextService.getContext(tenantId, managerUserId);
        Assertions.assertEquals(fresh.functionalPermissions(), cached.functionalPermissions());
        Assertions.assertEquals(fresh.effectiveBranchIds(), cached.effectiveBranchIds());
        Assertions.assertEquals(fresh.contextVersion(), cached.contextVersion(),
            "Lần đọc thứ hai phải lấy từ cache (giữ nguyên contextVersion)");

        permissionInvalidationService.publish(
            new BranchAssignmentChangedEvent(tenantId, managerUserId, hcmBranchId, "S2ENG_TEST"));
        awaitKeyDeleted(key);
    }

    @Test
    @Transactional
    @DisplayName("TASK-288: tenant is_locked/status không hợp lệ bị chặn khi build context")
    public void testTenantGuards() {
        updateTenantState("UPDATE tenants SET is_locked = TRUE WHERE id = ?1", tenantId);
        ApiException locked = Assertions.assertThrows(ApiException.class,
            () -> securityContextService.buildContext(tenantId, managerUserId));
        Assertions.assertEquals(ErrorCode.TENANT_LOCKED, locked.getErrorCode());

        updateTenantState("UPDATE tenants SET is_locked = FALSE, status = 'SUSPENDED' WHERE id = ?1", tenantId);
        ApiException suspended = Assertions.assertThrows(ApiException.class,
            () -> securityContextService.buildContext(tenantId, managerUserId));
        Assertions.assertEquals(ErrorCode.TENANT_SUSPENDED, suspended.getErrorCode());

        updateTenantState("UPDATE tenants SET status = 'DELETED' WHERE id = ?1", tenantId);
        ApiException deleted = Assertions.assertThrows(ApiException.class,
            () -> securityContextService.buildContext(tenantId, managerUserId));
        Assertions.assertEquals(ErrorCode.TENANT_NOT_FOUND, deleted.getErrorCode());

        UUID missing = UUID.randomUUID();
        ApiException notFound = Assertions.assertThrows(ApiException.class,
            () -> securityContextService.buildContext(missing, managerUserId));
        Assertions.assertEquals(ErrorCode.TENANT_NOT_FOUND, notFound.getErrorCode());
    }

    @Test
    @Transactional
    @DisplayName("TASK-288: tenant owner không có policy rõ ràng fallback ALL, user thường fallback NONE")
    public void testOwnerFallbackAll() {
        UUID ownerUserId = S2EngineFixtures.insertUser(em, "owner-" + suffix);
        S2EngineFixtures.insertUserTenant(em, ownerUserId, tenantId, "OWNER");
        UUID ownerRole = S2EngineFixtures.systemRoleId(em, "TENANT_OWNER");
        S2EngineFixtures.assignRole(em, ownerUserId, tenantId, ownerRole);

        UserSecurityContext owner = securityContextService.buildContext(tenantId, ownerUserId);
        Assertions.assertTrue(owner.isTenantOwner());
        Assertions.assertEquals(DataScope.ALL, new DataScopeResolver().resolve(owner, "OTHER_RESOURCE", DataOperation.READ));

        UserSecurityContext manager = securityContextService.buildContext(tenantId, managerUserId);
        Assertions.assertEquals(DataScope.NONE, new DataScopeResolver().resolve(manager, "OTHER_RESOURCE", DataOperation.READ));
    }

    private void updateTenantState(String sql, UUID id) {
        em.createNativeQuery(sql).setParameter(1, id).executeUpdate();
        // Native SQL bypasses the session cache: clear so buildContext reloads the row.
        em.clear();
    }

    private void awaitKeyDeleted(String key) throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < deadline) {
            if (redis.value(String.class).get(key) == null) {
                return;
            }
            Thread.sleep(50);
        }
        Assertions.fail("Key " + key + " chưa bị invalidation xóa sau 10s");
    }
}
