package com.vn9melody.openerp.modules.iam.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.UUID;

/**
 * Assigns a seeded global system role ({@code roles.tenant_id IS NULL}) to a
 * tenant user (TASK-271 / BUG-54, TASK-267 retrofit).
 *
 * <p>{@code roles + user_roles} is the single source of truth for functional
 * permissions, so user-provisioning flows must create the mapping; otherwise a
 * freshly registered tenant administrator would have no {@code user_roles} row
 * and the functional permission filter would deny every core API call.</p>
 */
@ApplicationScoped
public class SystemRoleAssigner {

    public static final String TENANT_OWNER = "TENANT_OWNER";
    public static final String TENANT_ADMIN = "TENANT_ADMIN";
    public static final String STAFF = "STAFF";

    @Inject
    EntityManager entityManager;

    /** Idempotent insert of {@code (user, tenant, system role)}. */
    public void assignSystemRole(UUID tenantId, UUID userId, String roleCode) {
        if (tenantId == null || userId == null || roleCode == null || roleCode.isBlank()) {
            return;
        }
        entityManager.createNativeQuery(
                "INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_at) "
                    + "SELECT ?1, ?2, r.id, NOW() FROM roles r "
                    + "WHERE r.tenant_id IS NULL AND r.code = ?3 "
                    + "ON CONFLICT (user_id, tenant_id, role_id) DO NOTHING")
            .setParameter(1, userId)
            .setParameter(2, tenantId)
            .setParameter(3, roleCode.trim().toUpperCase())
            .executeUpdate();
    }
}
