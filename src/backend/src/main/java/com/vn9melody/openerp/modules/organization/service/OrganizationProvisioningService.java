package com.vn9melody.openerp.modules.organization.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.UUID;

/**
 * Creates the default organization structure required by BR-RBAC-03 (every user
 * must belong to a primary branch and department so the data-scope engine can
 * compute a scope).
 *
 * <p>Mirrors the one-off backfill {@code V2.0.1__backfill_existing_tenants.sql} for
 * tenants created after it: a default branch {@code HQ} plus a root department
 * {@code GENERAL}, and the primary membership/branch assignment for the creator.
 * Idempotent — safe to run again for the same tenant.</p>
 */
@ApplicationScoped
public class OrganizationProvisioningService {

    @Inject
    EntityManager entityManager;

    public void provisionDefaults(UUID tenantId, UUID userId) {
        if (tenantId == null) {
            return;
        }
        entityManager.createNativeQuery(
                "INSERT INTO branches (tenant_id, code, name, is_default, status) "
                    + "VALUES (?1, 'HQ', 'Trụ sở chính', TRUE, 'ACTIVE') "
                    + "ON CONFLICT (tenant_id, code) DO NOTHING")
                .setParameter(1, tenantId)
                .executeUpdate();

        entityManager.createNativeQuery(
                "INSERT INTO departments (tenant_id, branch_id, parent_id, code, name, status) "
                    + "SELECT ?1, b.id, NULL, 'GENERAL', 'Phòng ban chung', 'ACTIVE' "
                    + "FROM branches b WHERE b.tenant_id = ?1 AND b.code = 'HQ' "
                    + "ON CONFLICT (tenant_id, code) DO NOTHING")
                .setParameter(1, tenantId)
                .executeUpdate();

        if (userId == null) {
            return;
        }

        entityManager.createNativeQuery(
                "INSERT INTO user_department_memberships "
                    + "(id, user_id, tenant_id, branch_id, department_id, is_primary, joined_at) "
                    + "SELECT gen_random_uuid(), ?1, ?2, b.id, d.id, TRUE, NOW() "
                    + "FROM branches b JOIN departments d "
                    + "ON d.tenant_id = b.tenant_id AND d.code = 'GENERAL' "
                    + "WHERE b.tenant_id = ?2 AND b.code = 'HQ'")
                .setParameter(1, userId)
                .setParameter(2, tenantId)
                .executeUpdate();

        entityManager.createNativeQuery(
                "INSERT INTO user_branch_assignments "
                    + "(id, user_id, tenant_id, branch_id, is_primary, can_manage, assigned_at) "
                    + "SELECT gen_random_uuid(), ?1, ?2, b.id, TRUE, FALSE, NOW() "
                    + "FROM branches b WHERE b.tenant_id = ?2 AND b.code = 'HQ'")
                .setParameter(1, userId)
                .setParameter(2, tenantId)
                .executeUpdate();
    }
}
