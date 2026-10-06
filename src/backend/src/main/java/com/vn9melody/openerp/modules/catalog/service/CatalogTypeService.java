package com.vn9melody.openerp.modules.catalog.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.audit.AuditTrail;
import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
import com.vn9melody.openerp.core.enums.CatalogRelationType;
import com.vn9melody.openerp.core.enums.CatalogStatus;
import com.vn9melody.openerp.core.enums.CatalogTypeSource;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.modules.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.modules.catalog.api.CatalogSupport;
import com.vn9melody.openerp.modules.catalog.dto.CatalogTypeDtos.GrantItem;
import com.vn9melody.openerp.modules.catalog.dto.CatalogTypeDtos.GrantReplaceRequest;
import com.vn9melody.openerp.modules.catalog.dto.CatalogTypeDtos.GrantResponse;
import com.vn9melody.openerp.modules.catalog.dto.CatalogTypeDtos.TypeCreateRequest;
import com.vn9melody.openerp.modules.catalog.dto.CatalogTypeDtos.TypeResponse;
import com.vn9melody.openerp.modules.catalog.dto.CatalogTypeDtos.TypeUpdateRequest;
import com.vn9melody.openerp.modules.catalog.model.CatalogType;
import com.vn9melody.openerp.modules.catalog.model.CatalogTypeGrant;
import com.vn9melody.openerp.modules.catalog.repository.CatalogTypeGrantRepository;
import com.vn9melody.openerp.modules.catalog.repository.CatalogTypeRepository;
import com.vn9melody.openerp.modules.iam.model.Role;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Catalog type administration + per-type grants (TASK-378 / DES-API-S05-001 section 2).
 * A type {@code code} is immutable after creation; system types are platform-owned
 * and tenants can never update them.
 */
@ApplicationScoped
public class CatalogTypeService {

    private static final String[] DEFAULT_RELATIONS = {"HIERARCHY"};
    private static final Set<String> DEFAULT_GRANT_ROLE_CODES = Set.of("TENANT_OWNER", "TENANT_ADMIN");

    @Inject
    CatalogTypeRepository typeRepository;

    @Inject
    CatalogTypeGrantRepository grantRepository;

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    AuditTrail auditTrail;

    /** Tenant view: system + own types (both rows; {@code is_system} distinguishes them). */
    public List<TypeResponse> list(UUID tenantId) {
        return typeRepository.listVisible(tenantId).stream().map(CatalogTypeService::toResponse).toList();
    }

    /** Platform view: system types only. */
    public List<TypeResponse> listSystem() {
        return typeRepository.list("tenantId is null order by code asc").stream()
            .map(CatalogTypeService::toResponse).toList();
    }

    @Transactional
    public TypeResponse create(UUID tenantId, TypeCreateRequest request) {
        String code = CatalogSupport.normalizeCode(request.code());
        if (code == null) {
            throw CatalogSupport.validation("code", ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        if (code.length() > CatalogSupport.MAX_CODE_LENGTH) {
            throw CatalogSupport.validation("code", ErrorCode.VALIDATION_MAX,
                Map.of("max", CatalogSupport.MAX_CODE_LENGTH));
        }
        CatalogType existing = tenantId == null
            ? typeRepository.findSystemByCode(code)
            : typeRepository.findByTenantAndCode(tenantId, code);
        if (existing != null) {
            throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_TYPE_CODE_EXISTS,
                Map.of(ResponseKey.CODE.getKey(), code));
        }

        CatalogType type = new CatalogType();
        type.tenantId = tenantId;
        type.code = code;
        applyCreate(type, request);
        type.source = CatalogTypeSource.PLUGIN;
        type.createdAt = Instant.now();
        type.updatedAt = type.createdAt;
        type.persist();

        if (tenantId != null) {
            createDefaultGrants(tenantId, type.id);
        }
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_TYPE_CREATE, "CATALOG_TYPE", type.id,
            Map.of(ResponseKey.CODE.getKey(), type.code));
        return toResponse(type);
    }

    @Transactional
    public TypeResponse update(UUID tenantId, UUID typeId, TypeUpdateRequest request) {
        CatalogType type = requireOwnedType(tenantId, typeId);
        applyUpdate(type, request);
        type.updatedAt = Instant.now();
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_TYPE_UPDATE, "CATALOG_TYPE", type.id,
            Map.of(ResponseKey.CODE.getKey(), type.code));
        return toResponse(type);
    }

    public List<GrantResponse> grants(UUID tenantId, String code) {
        CatalogType type = requireTenantManagedType(tenantId, code);
        List<CatalogTypeGrant> grants = grantRepository.listByTenantAndType(tenantId, type.id);
        Map<UUID, String> roleCodes = roleCodes(grants.stream().map(grant -> grant.roleId).toList());
        return grants.stream()
            .map(grant -> new GrantResponse(grant.id, grant.roleId, roleCodes.get(grant.roleId),
                grant.canRead, grant.canWrite))
            .toList();
    }

    @Transactional
    public List<GrantResponse> replaceGrants(UUID tenantId, String code, GrantReplaceRequest request) {
        CatalogType type = requireTenantManagedType(tenantId, code);
        List<GrantItem> items = request != null && request.grants() != null ? request.grants() : List.of();

        List<CatalogTypeGrant> replacements = new ArrayList<>();
        Set<UUID> seenRoles = new HashSet<>();
        for (GrantItem item : items) {
            UUID roleId = CatalogSupport.parseUuid(item.roleId(), ResponseKey.ROLE_ID.getKey());
            if (roleId == null) {
                throw CatalogSupport.validation(ResponseKey.ROLE_ID.getKey(), ErrorCode.VALIDATION_REQUIRED, Map.of());
            }
            Role role = Role.findById(roleId);
            if (role == null || (role.tenantId != null && !role.tenantId.equals(tenantId))) {
                throw CatalogSupport.validation(ResponseKey.ROLE_ID.getKey(), ErrorCode.VALIDATION_INVALID,
                    Map.of(ResponseKey.ROLE_ID.getKey(), roleId.toString()));
            }
            if (!seenRoles.add(roleId)) {
                throw CatalogSupport.validation(ResponseKey.ROLE_ID.getKey(), ErrorCode.VALIDATION_INVALID,
                    Map.of(ResponseKey.ROLE_ID.getKey(), roleId.toString()));
            }
            CatalogTypeGrant grant = new CatalogTypeGrant();
            grant.tenantId = tenantId;
            grant.typeId = type.id;
            grant.roleId = roleId;
            grant.canRead = item.canRead() == null || item.canRead();
            grant.canWrite = item.canWrite() != null && item.canWrite();
            grant.createdAt = Instant.now();
            grant.updatedAt = grant.createdAt;
            replacements.add(grant);
        }

        CatalogTypeGrant.delete("tenantId = ?1 and typeId = ?2", tenantId, type.id);
        replacements.forEach(grantRepository::persist);
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_GRANT_UPDATE, "CATALOG_TYPE", type.id,
            Map.of(ResponseKey.CODE.getKey(), type.code));

        Map<UUID, String> roleCodes = roleCodes(replacements.stream().map(grant -> grant.roleId).toList());
        return replacements.stream()
            .map(grant -> new GrantResponse(grant.id, grant.roleId, roleCodes.get(grant.roleId),
                grant.canRead, grant.canWrite))
            .toList();
    }

    private CatalogType requireOwnedType(UUID tenantId, UUID typeId) {
        CatalogType type = typeId != null ? typeRepository.findById(typeId) : null;
        if (type == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_TYPE_NOT_FOUND, ResponseKey.ID.getKey(), typeId);
        }
        if (!Objects.equals(type.tenantId, tenantId)) {
            if (type.tenantId == null) {
                // DES-API section 1: system types are read-only for tenants.
                throw CatalogPermissionGuard.typeForbidden(type.code);
            }
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_TYPE_NOT_FOUND, ResponseKey.ID.getKey(), typeId);
        }
        return type;
    }

    /** Grants exist for tenant-owned types only; system types answer CATALOG_TYPE_FORBIDDEN. */
    private CatalogType requireTenantManagedType(UUID tenantId, String code) {
        CatalogType type = guard.requireVisibleType(tenantId, code);
        if (!Objects.equals(type.tenantId, tenantId)) {
            throw CatalogPermissionGuard.typeForbidden(type.code);
        }
        return type;
    }

    private void createDefaultGrants(UUID tenantId, UUID typeId) {
        List<Role> roles = Role.list("tenantId is null and code in ?1", DEFAULT_GRANT_ROLE_CODES);
        for (Role role : roles) {
            CatalogTypeGrant grant = new CatalogTypeGrant();
            grant.tenantId = tenantId;
            grant.typeId = typeId;
            grant.roleId = role.id;
            grant.canRead = true;
            grant.canWrite = true;
            grant.persist();
        }
    }

    private static void applyCreate(CatalogType type, TypeCreateRequest request) {
        type.nameKey = requiredNameKey(request.nameKey());
        type.descriptionKey = trimToNull(request.descriptionKey());
        type.hierarchyMode = CatalogSupport.parseEnum(CatalogHierarchyMode.class, request.hierarchyMode(),
            "hierarchy_mode", CatalogHierarchyMode.TREE);
        type.allowedRelations = relations(request.allowedRelations(), DEFAULT_RELATIONS);
        type.allowedParentTypes = parentTypes(request.allowedParentTypes());
        type.maxDepth = request.maxDepth() != null ? request.maxDepth().shortValue() : null;
        type.minParents = request.minParents() != null ? request.minParents().shortValue() : 0;
        type.allowFreeText = Boolean.TRUE.equals(request.allowFreeText());
        type.versioned = request.versioned() == null || request.versioned();
        type.effectiveDated = request.effectiveDated() == null || request.effectiveDated();
        type.attributesSchema = request.attributesSchema();
        type.status = CatalogSupport.parseEnum(CatalogStatus.class, request.status(), "status", CatalogStatus.ACTIVE);
    }

    private static void applyUpdate(CatalogType type, TypeUpdateRequest request) {
        if (request.nameKey() != null) {
            type.nameKey = requiredNameKey(request.nameKey());
        }
        if (request.descriptionKey() != null) {
            type.descriptionKey = trimToNull(request.descriptionKey());
        }
        if (request.hierarchyMode() != null) {
            type.hierarchyMode = CatalogSupport.parseEnum(CatalogHierarchyMode.class, request.hierarchyMode(),
                "hierarchy_mode", type.hierarchyMode);
        }
        if (request.allowedRelations() != null) {
            type.allowedRelations = relations(request.allowedRelations(), type.allowedRelations);
        }
        if (request.allowedParentTypes() != null) {
            type.allowedParentTypes = parentTypes(request.allowedParentTypes());
        }
        if (request.maxDepth() != null) {
            type.maxDepth = request.maxDepth().shortValue();
        }
        if (request.minParents() != null) {
            type.minParents = request.minParents().shortValue();
        }
        if (request.allowFreeText() != null) {
            type.allowFreeText = request.allowFreeText();
        }
        if (request.versioned() != null) {
            type.versioned = request.versioned();
        }
        if (request.effectiveDated() != null) {
            type.effectiveDated = request.effectiveDated();
        }
        if (request.attributesSchema() != null) {
            type.attributesSchema = request.attributesSchema();
        }
        if (request.status() != null) {
            type.status = CatalogSupport.parseEnum(CatalogStatus.class, request.status(), "status", type.status);
        }
    }

    private static String requiredNameKey(String value) {
        if (value == null || value.isBlank()) {
            throw CatalogSupport.validation("name_key", ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        return value.trim();
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Validated relation names, stored as-is (upper case). */
    private static String[] relations(List<String> values, String[] fallback) {
        if (values == null) {
            return fallback;
        }
        List<String> normalized = new ArrayList<>();
        for (String value : values) {
            CatalogRelationType relation = CatalogSupport.parseEnum(CatalogRelationType.class, value,
                "allowed_relations", null);
            if (relation == null) {
                throw CatalogSupport.validation("allowed_relations", ErrorCode.VALIDATION_REQUIRED, Map.of());
            }
            normalized.add(relation.name());
        }
        return normalized.toArray(String[]::new);
    }

    private static String[] parentTypes(List<String> values) {
        if (values == null) {
            return null;
        }
        List<String> normalized = new ArrayList<>();
        for (String value : values) {
            String code = CatalogSupport.normalizeCode(value);
            if (code == null) {
                throw CatalogSupport.validation("allowed_parent_types", ErrorCode.VALIDATION_REQUIRED, Map.of());
            }
            normalized.add(code);
        }
        return normalized.toArray(String[]::new);
    }

    private static Map<UUID, String> roleCodes(List<UUID> roleIds) {
        Map<UUID, String> codes = new HashMap<>();
        if (roleIds.isEmpty()) {
            return codes;
        }
        for (Role role : Role.<Role>list("id in ?1", roleIds)) {
            codes.put(role.id, role.code);
        }
        return codes;
    }

    static TypeResponse toResponse(CatalogType type) {
        return new TypeResponse(
            type.id,
            type.code,
            type.nameKey,
            type.descriptionKey,
            type.hierarchyMode.name(),
            type.allowedRelations != null ? Arrays.asList(type.allowedRelations) : List.of(),
            type.allowedParentTypes != null ? Arrays.asList(type.allowedParentTypes) : null,
            type.maxDepth != null ? type.maxDepth.intValue() : null,
            type.minParents,
            type.allowFreeText,
            type.versioned,
            type.effectiveDated,
            type.source.name(),
            type.sourceRef,
            type.attributesSchema,
            type.status.name(),
            type.tenantId == null,
            type.createdAt,
            type.updatedAt);
    }

    static ApiException notFound(String field, Object value) {
        return CatalogSupport.notFound(CatalogErrorCode.CATALOG_TYPE_NOT_FOUND, field, value);
    }
}
