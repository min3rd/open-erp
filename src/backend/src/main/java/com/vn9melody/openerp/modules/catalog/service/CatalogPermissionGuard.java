package com.vn9melody.openerp.modules.catalog.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.modules.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.modules.catalog.api.CatalogSupport;
import com.vn9melody.openerp.modules.catalog.model.CatalogType;
import com.vn9melody.openerp.modules.catalog.repository.CatalogTypeGrantRepository;
import com.vn9melody.openerp.modules.catalog.repository.CatalogTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Map;
import java.util.UUID;

/**
 * Two-tier authorization of the catalog plugin (TASK-382): the module permission
 * is declared by {@code @RequirePermission} on the resource and enforced by
 * {@code PermissionEnforcementFilter}; this guard adds the per-type
 * {@code catalog_type_grants} check for the acting role(s) (AC-09).
 *
 * <p>System types ({@code tenant_id IS NULL}) are read-only for tenants; tenants
 * may still create their own override rows under a system type (TASK-391), which
 * is handled by the item service instead of this guard.</p>
 */
@ApplicationScoped
public class CatalogPermissionGuard {

    public enum Access {
        READ,
        WRITE
    }

    @Inject
    SecurityContextService securityContextService;

    @Inject
    CatalogTypeRepository typeRepository;

    @Inject
    CatalogTypeGrantRepository grantRepository;

    /** Resolved security context of the caller (tenant users only). */
    public UserSecurityContext context() {
        return securityContextService.getCurrentContext();
    }

    public CatalogType requireVisibleType(UUID tenantId, String code) {
        CatalogType type = typeRepository.findVisibleByCode(tenantId, code);
        if (type == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_TYPE_NOT_FOUND, ResponseKey.CODE.getKey(), code);
        }
        return type;
    }

    public CatalogType requireTypeAccess(UUID tenantId, String code, Access access) {
        CatalogType type = requireVisibleType(tenantId, code);
        requireTypeAccess(tenantId, type, access);
        return type;
    }

    /**
     * READ: system types are readable with the module permission; tenant types
     * need a {@code can_read} grant. WRITE: system types are platform-only;
     * tenant types need a {@code can_write} grant for one of the caller's roles.
     */
    public void requireTypeAccess(UUID tenantId, CatalogType type, Access access) {
        if (tenantId == null) {
            return;
        }
        if (type.tenantId == null) {
            if (access == Access.WRITE) {
                throw typeForbidden(type.code);
            }
            return;
        }
        if (!tenantId.equals(type.tenantId)) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_TYPE_NOT_FOUND,
                ResponseKey.CODE.getKey(), type.code);
        }
        UserSecurityContext context = context();
        boolean allowed = grantRepository.listByTenantAndType(tenantId, type.id).stream()
            .filter(grant -> context.roleIds().contains(grant.roleId))
            .anyMatch(grant -> access == Access.WRITE ? grant.canWrite : grant.canRead);
        if (!allowed) {
            throw typeForbidden(type.code);
        }
    }

    public static ApiException typeForbidden(String typeCode) {
        return new ApiException(403, CatalogErrorCode.CATALOG_TYPE_FORBIDDEN,
            "The acting role has no grant on this catalog type",
            Map.of(ResponseKey.CODE.getKey(), typeCode));
    }

    /** Non-throwing variant used when scanning types (export {@code all=true}). */
    public boolean hasTypeAccess(UUID tenantId, CatalogType type, Access access) {
        try {
            requireTypeAccess(tenantId, type, access);
            return true;
        } catch (ApiException e) {
            return false;
        }
    }

    public static boolean contains(String[] values, String candidate) {
        if (values == null || candidate == null) {
            return false;
        }
        for (String value : values) {
            if (candidate.equals(value)) {
                return true;
            }
        }
        return false;
    }
}
