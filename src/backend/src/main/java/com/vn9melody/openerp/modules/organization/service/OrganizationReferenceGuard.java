package com.vn9melody.openerp.modules.organization.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.UUID;

/**
 * Tenant isolation guard for Organization write operations. A branch, department, manager or
 * member that does not belong to the caller tenant must never be referenced
 * (ORGANIZATION_CROSS_TENANT_REFERENCE).
 */
@ApplicationScoped
public class OrganizationReferenceGuard {

    @Inject
    EntityManager entityManager;

    public void requireUserInTenant(UUID tenantId, UUID userId) {
        if (userId == null) {
            return;
        }
        Number count = (Number) entityManager.createNativeQuery(
                "select count(*) from user_tenants where user_id = ?1 and tenant_id = ?2")
            .setParameter(1, userId)
            .setParameter(2, tenantId)
            .getSingleResult();
        if (count == null || count.longValue() == 0) {
            throw new ApiException(400, OrganizationErrorCodes.CROSS_TENANT_REFERENCE,
                "Referenced user does not belong to the current tenant");
        }
    }

    public UUID parseUuid(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, "VALIDATION_INVALID_FORMAT", "Invalid UUID value for " + fieldName);
        }
    }
}
