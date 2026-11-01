package com.vn9melody.openerp.core.context;

import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-428: SecurityContextService reads the plugin projection first, keeps
 * tenant isolation and rebuilds department/subordinate scope from projection
 * tables instead of the legacy organization tables.
 */
@QuarkusTest
public class ScopeProjectionServiceTest {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    EntityManager em;

    private String suffix;
    private UUID tenantId;
    private UUID userId;
    private UUID primaryBranchId;
    private UUID memberBranchId;
    private UUID managedBranchId;
    private UUID primaryDepartmentId;
    private UUID childDepartmentId;
    private UUID subordinateUserId;

    @BeforeEach
    @Transactional
    public void setup() {
        suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        userId = S2EngineFixtures.insertUser(em, "proj-" + suffix);
        subordinateUserId = S2EngineFixtures.insertUser(em, "proj-sub-" + suffix);
        S2EngineFixtures.insertUserTenant(em, userId, tenantId, "MEMBER");
        S2EngineFixtures.insertUserTenant(em, subordinateUserId, tenantId, "MEMBER");

        primaryBranchId = UUID.randomUUID();
        memberBranchId = UUID.randomUUID();
        managedBranchId = UUID.randomUUID();
        primaryDepartmentId = UUID.randomUUID();
        childDepartmentId = UUID.randomUUID();

        em.createNativeQuery("""
                INSERT INTO core_user_scope
                    (tenant_id, user_id, primary_branch_id, primary_department_id,
                     member_branch_ids, managed_branch_ids, department_ids, version)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 7)
                """)
            .setParameter(1, tenantId)
            .setParameter(2, userId)
            .setParameter(3, primaryBranchId)
            .setParameter(4, primaryDepartmentId)
            .setParameter(5, new UUID[]{primaryBranchId, memberBranchId})
            .setParameter(6, new UUID[]{managedBranchId})
            .setParameter(7, new UUID[]{primaryDepartmentId})
            .executeUpdate();

        em.createNativeQuery("""
                INSERT INTO core_department_closure
                    (tenant_id, ancestor_id, descendant_id, depth)
                VALUES (?1, ?2, ?3, 1), (?1, ?2, ?2, 0)
                """)
            .setParameter(1, tenantId)
            .setParameter(2, primaryDepartmentId)
            .setParameter(3, childDepartmentId)
            .executeUpdate();

        em.createNativeQuery("""
                INSERT INTO core_user_manager_edge
                    (tenant_id, manager_user_id, subordinate_user_id, source)
                VALUES (?1, ?2, ?3, 'EMPLOYEE')
                """)
            .setParameter(1, tenantId)
            .setParameter(2, userId)
            .setParameter(3, subordinateUserId)
            .executeUpdate();

        securityContextService.invalidate(tenantId, userId);
    }

    @Test
    @Transactional
    @DisplayName("TASK-428: projection branches/departments take precedence over legacy tables")
    public void testProjectionIsReadFirst() {
        UserSecurityContext context = securityContextService.buildContext(tenantId, userId);

        Assertions.assertEquals(primaryBranchId, context.primaryBranchId());
        Assertions.assertEquals(primaryDepartmentId, context.departmentId());
        Assertions.assertEquals(Set.of(primaryBranchId, memberBranchId), context.memberBranchIds());
        Assertions.assertEquals(Set.of(managedBranchId), context.managedBranchIds());
        Assertions.assertEquals(Set.of(primaryBranchId, memberBranchId, managedBranchId),
            context.effectiveBranchIds());
        Assertions.assertTrue(context.departmentAndChildIds().contains(childDepartmentId),
            "department closure must include descendants");
        Assertions.assertTrue(context.subordinateUserIds().contains(subordinateUserId),
            "manager edge must include the subordinate");
    }

    @Test
    @Transactional
    @DisplayName("TASK-428: projection rows are tenant-scoped (no cross-tenant leakage)")
    public void testProjectionIsTenantScoped() {
        UUID otherTenantId = S2EngineFixtures.insertTenant(em, "other-" + suffix);
        S2EngineFixtures.insertUserTenant(em, userId, otherTenantId, "MEMBER");
        securityContextService.invalidate(otherTenantId, userId);

        UserSecurityContext other = securityContextService.buildContext(otherTenantId, userId);

        Assertions.assertNull(other.primaryBranchId());
        Assertions.assertTrue(other.memberBranchIds().isEmpty());
        Assertions.assertTrue(other.managedBranchIds().isEmpty());
        Assertions.assertTrue(other.departmentIds().isEmpty());
        Assertions.assertTrue(other.subordinateUserIds().isEmpty());
    }
}
