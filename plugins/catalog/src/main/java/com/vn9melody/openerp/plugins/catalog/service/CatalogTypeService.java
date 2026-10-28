package com.vn9melody.openerp.plugins.catalog.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugins.catalog.service.AuditTrail;
import com.vn9melody.openerp.plugins.catalog.api.CatalogHierarchyMode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.api.PlatformAction;
import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogSupport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.GrantItem;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.GrantReplaceRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.GrantResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeRelationGroup;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeRelationItem;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeRelationUpdateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeRelationsResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeUpdateRequest;
import com.vn9melody.openerp.plugins.catalog.gateway.CatalogGateway;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import com.vn9melody.openerp.plugins.catalog.model.CatalogTypeGrant;
import com.vn9melody.openerp.plugins.catalog.model.CatalogTypeRelation;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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
    CatalogGateway gateway;

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    AuditTrail auditTrail;

    /** Tenant view: system + own types, hiding a system row replaced by a tenant clone. */
    public List<TypeResponse> list(UUID tenantId) {
        List<CatalogType> visible = gateway.visibleTypes(tenantId);
        Set<String> tenantCodes = visible.stream()
            .filter(type -> Objects.equals(type.tenantId, tenantId))
            .map(type -> type.code)
            .collect(java.util.stream.Collectors.toSet());
        return visible.stream()
            .filter(type -> !(type.tenantId == null && tenantCodes.contains(type.code)))
            .map(CatalogTypeService::toResponse).toList();
    }

    /** Platform view: system types only. */
    public List<TypeResponse> listSystem() {
        return gateway.systemTypes().stream()
            .map(CatalogTypeService::toResponse).toList();
    }

    public TypeResponse create(UUID tenantId, TypeCreateRequest request) {
        String code = CatalogSupport.normalizeCode(request.code());
        if (code == null) {
            throw CatalogSupport.validation("code", ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        if (code.length() > CatalogSupport.MAX_CODE_LENGTH) {
            throw CatalogSupport.validation("code", ErrorCode.VALIDATION_MAX,
                Map.of("max", CatalogSupport.MAX_CODE_LENGTH));
        }
        CatalogType existing = gateway.typeByCodeExact(tenantId, code);
        if (existing != null) {
            throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_TYPE_CODE_EXISTS,
                Map.of(ResponseKey.CODE.getKey(), code));
        }

        CatalogType draft = new CatalogType();
        draft.tenantId = tenantId;
        draft.code = code;
        applyCreate(draft, request);
        draft.createdAt = Instant.now();
        draft.updatedAt = draft.createdAt;
        CatalogType type = gateway.insertType(tenantId, typeParams(draft), tenantId == null);

        if (tenantId != null) {
            createDefaultGrants(tenantId, type.id);
        }
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_TYPE_CREATE, "CATALOG_TYPE", type.id,
            Map.of(ResponseKey.CODE.getKey(), type.code));
        return toResponse(type);
    }

    public TypeResponse update(UUID tenantId, UUID typeId, TypeUpdateRequest request) {
        CatalogType type = requireOwnedType(tenantId, typeId);
        applyUpdate(type, request);
        type.updatedAt = Instant.now();
        CatalogType saved = gateway.updateType(tenantId, typeParams(type), tenantId == null);
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_TYPE_UPDATE, "CATALOG_TYPE", saved.id,
            Map.of(ResponseKey.CODE.getKey(), saved.code));
        return toResponse(saved);
    }

    public List<GrantResponse> grants(UUID tenantId, String code) {
        CatalogType type = requireTenantManagedType(tenantId, code);
        List<CatalogTypeGrant> grants = gateway.grantsByType(tenantId, type.id);
        return grants.stream()
            .map(grant -> new GrantResponse(grant.id, grant.roleCode, grant.canRead, grant.canWrite))
            .toList();
    }

    public List<GrantResponse> replaceGrants(UUID tenantId, String code, GrantReplaceRequest request) {
        CatalogType type = requireTenantManagedType(tenantId, code);
        List<GrantItem> items = request != null && request.grants() != null ? request.grants() : List.of();

        List<Map<String, Object>> replacements = new ArrayList<>();
        Set<String> seenRoles = new HashSet<>();
        Instant now = Instant.now();
        for (GrantItem item : items) {
            String roleCode = item.roleCode() == null ? null : item.roleCode().trim().toUpperCase();
            if (roleCode == null || roleCode.isBlank()) {
                throw CatalogSupport.validation(ResponseKey.ROLE_CODE.getKey(), ErrorCode.VALIDATION_REQUIRED, Map.of());
            }
            if (!seenRoles.add(roleCode)) {
                throw CatalogSupport.validation(ResponseKey.ROLE_CODE.getKey(), ErrorCode.VALIDATION_INVALID,
                    Map.of(ResponseKey.ROLE_CODE.getKey(), roleCode));
            }
            Map<String, Object> grant = new java.util.LinkedHashMap<>();
            grant.put("type_id", type.id);
            grant.put("role_code", roleCode);
            grant.put("can_read", item.canRead() == null || item.canRead());
            grant.put("can_write", item.canWrite() != null && item.canWrite());
            grant.put("created_at", now);
            grant.put("updated_at", now);
            replacements.add(grant);
        }

        List<CatalogTypeGrant> saved = gateway.replaceGrants(tenantId, type.id, replacements);
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_GRANT_UPDATE, "CATALOG_TYPE", type.id,
            Map.of(ResponseKey.CODE.getKey(), type.code));

        return saved.stream()
            .map(grant -> new GrantResponse(grant.id, grant.roleCode, grant.canRead, grant.canWrite))
            .toList();
    }

    // ------------------------------------------------------------------
    // Type relations (FEAT-31)
    // ------------------------------------------------------------------

    public TypeRelationsResponse relations(UUID tenantId, String code, boolean system) {
        CatalogType type = system ? requireSystemType(code) : guard.requireVisibleType(tenantId, code);
        List<CatalogTypeRelation> parents = gateway.typeRelationsParents(tenantId, type.id);
        List<CatalogTypeRelation> children = gateway.typeRelationsChildren(tenantId, type.id);

        Set<UUID> relatedIds = new java.util.LinkedHashSet<>();
        parents.forEach(relation -> relatedIds.add(relation.parentTypeId));
        children.forEach(relation -> relatedIds.add(relation.childTypeId));
        Map<UUID, CatalogType> related = new HashMap<>();
        gateway.typesByIds(tenantId, relatedIds).forEach(relatedType -> related.put(relatedType.id, relatedType));

        Set<String> relationTypes = new java.util.LinkedHashSet<>();
        if (type.allowedRelations != null) {
            relationTypes.addAll(Arrays.asList(type.allowedRelations));
        }
        parents.forEach(relation -> relationTypes.add(relation.relationType.name()));
        children.forEach(relation -> relationTypes.add(relation.relationType.name()));

        List<TypeRelationGroup> groups = new ArrayList<>();
        for (String relationType : relationTypes) {
            List<TypeRelationItem> parentItems = parents.stream()
                .filter(relation -> relationType.equals(relation.relationType.name()))
                .map(relation -> related.get(relation.parentTypeId))
                .filter(Objects::nonNull)
                .sorted(java.util.Comparator.comparing(relatedType -> relatedType.code))
                .map(CatalogTypeService::toRelationItem)
                .toList();
            List<TypeRelationItem> childItems = children.stream()
                .filter(relation -> relationType.equals(relation.relationType.name()))
                .map(relation -> related.get(relation.childTypeId))
                .filter(Objects::nonNull)
                .sorted(java.util.Comparator.comparing(relatedType -> relatedType.code))
                .map(CatalogTypeService::toRelationItem)
                .toList();
            groups.add(new TypeRelationGroup(relationType, parentItems, childItems));
        }
        return new TypeRelationsResponse(groups);
    }

    public TypeRelationsResponse replaceRelations(UUID tenantId, String code,
                                                  TypeRelationUpdateRequest request, boolean system) {
        CatalogType type = requireTypeForScope(tenantId, code, system);
        if (request == null) {
            throw CatalogSupport.validation("relation_type", ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        CatalogRelationType relation = CatalogSupport.parseEnum(CatalogRelationType.class,
            request.relationType(), "relation_type", null);
        if (relation == null) {
            throw CatalogSupport.validation("relation_type", ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        if (type.allowedRelations == null || !Arrays.asList(type.allowedRelations).contains(relation.name())) {
            throw CatalogSupport.validation("relation_type", ErrorCode.VALIDATION_INVALID,
                Map.of("relation_type", relation.name()));
        }

        Map<String, CatalogType> visibleByCode = new HashMap<>();
        for (CatalogType visible : gateway.visibleTypes(tenantId)) {
            CatalogType current = visibleByCode.get(visible.code);
            if (current == null || (current.tenantId == null && visible.tenantId != null)) {
                visibleByCode.put(visible.code, visible);
            }
        }
        List<UUID> parentIds = resolveRelationTypes(request.parentCodes(), visibleByCode, relation, type);
        List<UUID> childIds = resolveRelationTypes(request.childCodes(), visibleByCode, relation, type);

        assertNoTypeCycle(tenantId, type.id, relation.name(), parentIds, childIds);
        gateway.replaceTypeRelations(tenantId, type.id, relation.name(), parentIds, childIds, system);
        syncLegacyParentTypes(tenantId, type, system);
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_TYPE_RELATION_UPDATE, "CATALOG_TYPE", type.id,
            Map.of(ResponseKey.CODE.getKey(), type.code, "relation_type", relation.name()));
        return relations(tenantId, code, system);
    }

    private CatalogType requireSystemType(String code) {
        CatalogType type = gateway.systemTypeByCode(code);
        if (type == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_TYPE_NOT_FOUND, "code", code);
        }
        return type;
    }

    private CatalogType requireTypeForScope(UUID tenantId, String code, boolean system) {
        if (system) {
            return requireSystemType(code);
        }
        CatalogType type = guard.requireVisibleType(tenantId, code);
        if (!Objects.equals(type.tenantId, tenantId)) {
            throw CatalogPermissionGuard.typeForbidden(type.code);
        }
        return type;
    }

    private static TypeRelationItem toRelationItem(CatalogType type) {
        return new TypeRelationItem(type.code, type.nameKey, type.tenantId == null);
    }

    private List<UUID> resolveRelationTypes(List<String> codes, Map<String, CatalogType> visibleByCode,
                                            CatalogRelationType relation, CatalogType self) {
        if (codes == null || codes.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = new ArrayList<>();
        for (String raw : codes) {
            String code = CatalogSupport.normalizeCode(raw);
            if (code == null) {
                throw CatalogSupport.validation("code", ErrorCode.VALIDATION_REQUIRED, Map.of());
            }
            CatalogType target = visibleByCode.get(code);
            if (target == null) {
                throw CatalogSupport.validation("code", ErrorCode.VALIDATION_INVALID, Map.of("code", code));
            }
            if (target.id.equals(self.id)) {
                throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_TYPE_RELATION_SELF, Map.of("code", code));
            }
            if (target.allowedRelations == null
                    || !Arrays.asList(target.allowedRelations).contains(relation.name())) {
                throw CatalogSupport.validation("code", ErrorCode.VALIDATION_INVALID,
                    Map.of("code", code, "relation_type", relation.name()));
            }
            if (!ids.contains(target.id)) {
                ids.add(target.id);
            }
        }
        return ids;
    }

    /** Type-level cycle guard for the same relation type (parent -> child). */
    private void assertNoTypeCycle(UUID tenantId, UUID typeId, String relationType,
                                   List<UUID> parentIds, List<UUID> childIds) {
        Map<UUID, Set<UUID>> edges = new HashMap<>();
        for (CatalogTypeRelation relation : gateway.allTypeRelations(tenantId)) {
            if (!relationType.equals(relation.relationType.name())) {
                continue;
            }
            edges.computeIfAbsent(relation.parentTypeId, key -> new HashSet<>()).add(relation.childTypeId);
        }
        edges.values().forEach(children -> children.remove(typeId));
        edges.remove(typeId);
        for (UUID parentId : parentIds) {
            edges.computeIfAbsent(parentId, key -> new HashSet<>()).add(typeId);
        }
        for (UUID childId : childIds) {
            edges.computeIfAbsent(typeId, key -> new HashSet<>()).add(childId);
        }
        Map<UUID, Integer> state = new HashMap<>();
        for (UUID node : edges.keySet()) {
            if (hasCycle(node, edges, state)) {
                throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_TYPE_RELATION_CYCLE,
                    Map.of("relation_type", relationType));
            }
        }
    }

    private static boolean hasCycle(UUID node, Map<UUID, Set<UUID>> edges, Map<UUID, Integer> state) {
        Integer current = state.get(node);
        if (current != null) {
            return current == 1;
        }
        state.put(node, 1);
        for (UUID next : edges.getOrDefault(node, Set.of())) {
            if (hasCycle(next, edges, state)) {
                return true;
            }
        }
        state.put(node, 2);
        return false;
    }

    /** Keeps the legacy {@code allowed_parent_types} array aligned with the relation rows. */
    private void syncLegacyParentTypes(UUID tenantId, CatalogType type, boolean system) {
        Set<UUID> parentIds = new HashSet<>();
        gateway.typeRelationsParentsFresh(tenantId, type.id)
            .forEach(relation -> parentIds.add(relation.parentTypeId));
        List<String> codes = gateway.typesByIds(tenantId, parentIds).stream()
            .map(parent -> parent.code)
            .sorted()
            .toList();
        Map<String, Object> params = typeParams(type);
        params.put("allowed_parent_types", codes.isEmpty() ? null : codes);
        params.put("updated_at", Instant.now());
        gateway.updateType(tenantId, params, system);
    }

    private CatalogType requireOwnedType(UUID tenantId, UUID typeId) {        CatalogType type = typeId != null ? gateway.typeById(tenantId, typeId) : null;
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

    void createDefaultGrants(UUID tenantId, UUID typeId) {
        Instant now = Instant.now();
        List<Map<String, Object>> grants = new ArrayList<>();
        for (String roleCode : DEFAULT_GRANT_ROLE_CODES) {
            Map<String, Object> grant = new java.util.LinkedHashMap<>();
            grant.put("type_id", typeId);
            grant.put("role_code", roleCode);
            grant.put("can_read", true);
            grant.put("can_write", true);
            grant.put("created_at", now);
            grant.put("updated_at", now);
            grants.add(grant);
        }
        gateway.replaceGrants(tenantId, typeId, grants);
    }

    private static Map<String, Object> typeParams(CatalogType type) {
        Map<String, Object> params = new java.util.LinkedHashMap<>();
        params.put("id", type.id);
        params.put("code", type.code);
        params.put("system_type_id", type.systemTypeId);
        params.put("name_key", type.nameKey);
        params.put("description_key", type.descriptionKey);
        params.put("hierarchy_mode", type.hierarchyMode == null ? null : type.hierarchyMode.name());
        params.put("allowed_relations", type.allowedRelations == null ? null : List.of(type.allowedRelations));
        params.put("allowed_parent_types", type.allowedParentTypes == null ? null : List.of(type.allowedParentTypes));
        params.put("max_depth", type.maxDepth);
        params.put("min_parents", type.minParents);
        params.put("allow_free_text", type.allowFreeText);
        params.put("versioned", type.versioned);
        params.put("effective_dated", type.effectiveDated);
        params.put("attributes_schema", type.attributesSchema);
        params.put("status", type.status == null ? null : type.status.name());
        params.put("updated_at", type.updatedAt);
        return params;
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
            type.attributesSchema,
            type.status.name(),
            type.tenantId == null,
            type.systemTypeId != null,
            type.createdAt,
            type.updatedAt);
    }

    static ApiException notFound(String field, Object value) {
        return CatalogSupport.notFound(CatalogErrorCode.CATALOG_TYPE_NOT_FOUND, field, value);
    }
}
