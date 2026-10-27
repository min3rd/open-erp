package com.vn9melody.openerp.plugins.catalog.service;

import com.vn9melody.openerp.plugins.catalog.api.ApiException;
import com.vn9melody.openerp.plugins.catalog.api.ErrorCode;
import com.vn9melody.openerp.plugins.catalog.service.AuditTrail;
import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.api.PlatformAction;
import com.vn9melody.openerp.plugins.catalog.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogSupport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.EdgeCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.EdgeResponse;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogItemEdgeRepository;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogItemRepository;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Multi-parent catalog relations (TASK-380 / DES-API-S05-001 section 3):
 * validates both items are visible to the caller, the relation is declared by the
 * child type, cross-type parents are allow-listed, and the new edge cannot close
 * a cycle (DES-DB T4.2). Removing an edge closes {@code valid_to} and respects
 * the child type's {@code min_parents}.
 */
@ApplicationScoped
public class CatalogEdgeService {

    @Inject
    CatalogItemEdgeRepository edgeRepository;

    @Inject
    CatalogItemRepository itemRepository;

    @Inject
    CatalogTypeRepository typeRepository;

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    AuditTrail auditTrail;

    @Transactional
    public EdgeResponse create(UUID tenantId, EdgeCreateRequest request) {
        UUID parentId = CatalogSupport.parseUuid(request.parentItemId(), "parent_item_id");
        UUID childId = CatalogSupport.parseUuid(request.childItemId(), "child_item_id");
        if (parentId == null || childId == null) {
            throw CatalogSupport.validation("parent_item_id", ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        if (parentId.equals(childId)) {
            throw new ApiException(400, CatalogErrorCode.CATALOG_EDGE_SELF_REFERENCE,
                "An item cannot be its own parent", Map.of(ResponseKey.ID.getKey(), childId.toString()));
        }

        CatalogItem parent = requireVisibleItem(tenantId, parentId);
        CatalogItem child = requireVisibleItem(tenantId, childId);
        CatalogType parentType = requireType(parent.typeId);
        CatalogType childType = requireType(child.typeId);

        if (tenantId != null) {
            // Tenants cannot restructure the platform-owned system catalogue; their
            // own items under a system type are overrides without parent edges.
            if (childType.tenantId == null) {
                throw CatalogPermissionGuard.typeForbidden(childType.code);
            }
            guard.requireTypeAccess(tenantId, childType, CatalogPermissionGuard.Access.WRITE);
        }

        CatalogRelationType relation = CatalogSupport.parseEnum(CatalogRelationType.class,
            request.relationType(), "relation_type", CatalogRelationType.HIERARCHY);
        if (!CatalogPermissionGuard.contains(childType.allowedRelations, relation.name())) {
            throw new ApiException(400, CatalogErrorCode.CATALOG_EDGE_RELATION_NOT_ALLOWED,
                "The relation type is not allowed by the child catalog type",
                Map.of(ResponseKey.CODE.getKey(), childType.code));
        }
        if (!parentType.id.equals(childType.id)
                && !CatalogPermissionGuard.contains(childType.allowedParentTypes, parentType.code)) {
            throw new ApiException(400, CatalogErrorCode.CATALOG_EDGE_PARENT_TYPE_NOT_ALLOWED,
                "Cross-type parents are not allowed by the child catalog type",
                Map.of(ResponseKey.CODE.getKey(), childType.code));
        }
        if (edgeRepository.wouldCreateCycle(parentId, childId)) {
            throw new ApiException(400, CatalogErrorCode.CATALOG_EDGE_CYCLE,
                "The edge would create a cycle in the catalog graph",
                Map.of(ResponseKey.PARENT_ID.getKey(), parentId.toString(),
                    ResponseKey.ID.getKey(), childId.toString()));
        }
        if (edgeRepository.findActiveEdge(tenantId, parentId, childId, relation) != null) {
            throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_EDGE_DUPLICATE,
                Map.of(ResponseKey.PARENT_ID.getKey(), parentId.toString(),
                    ResponseKey.ID.getKey(), childId.toString()));
        }

        CatalogItemEdge edge = new CatalogItemEdge();
        edge.tenantId = tenantId;
        edge.parentItemId = parentId;
        edge.childItemId = childId;
        edge.relationType = relation;
        edge.sortOrder = request.sortOrder() != null ? request.sortOrder() : 0;
        edge.status = CatalogStatus.ACTIVE;
        edge.createdBy = auditTrail.currentActorUserId();
        edge.validFrom = Instant.now();
        edge.persist();

        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_EDGE_CREATE, "CATALOG_EDGE", edge.id,
            Map.of(ResponseKey.PARENT_ID.getKey(), parentId.toString(),
                ResponseKey.ID.getKey(), childId.toString()));
        return toResponse(edge);
    }

    @Transactional
    public void close(UUID tenantId, UUID edgeId) {
        CatalogItemEdge edge = edgeRepository.findVisibleEdge(tenantId, edgeId);
        if (edge == null || edge.validTo != null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_EDGE_NOT_FOUND,
                ResponseKey.ID.getKey(), edgeId);
        }
        CatalogItem child = itemRepository.findVisibleById(tenantId, edge.childItemId);
        if (child == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_EDGE_NOT_FOUND,
                ResponseKey.ID.getKey(), edgeId);
        }
        CatalogType childType = requireType(child.typeId);
        if (tenantId != null) {
            if (childType.tenantId == null) {
                throw CatalogPermissionGuard.typeForbidden(childType.code);
            }
            guard.requireTypeAccess(tenantId, childType, CatalogPermissionGuard.Access.WRITE);
        }
        if (childType.minParents > 0
                && edgeRepository.countActiveParents(edge.childItemId) - 1 < childType.minParents) {
            throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_EDGE_MIN_PARENTS,
                Map.of(ResponseKey.CODE.getKey(), childType.code,
                    CatalogResponseKey.MIN_PARENTS.getKey(), childType.minParents));
        }

        edge.validTo = Instant.now();
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_EDGE_CLOSE, "CATALOG_EDGE", edge.id,
            Map.of(ResponseKey.ID.getKey(), edge.id.toString()));
    }

    private CatalogItem requireVisibleItem(UUID tenantId, UUID itemId) {
        CatalogItem item = itemRepository.findVisibleById(tenantId, itemId);
        if (item == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_ITEM_NOT_FOUND,
                ResponseKey.ID.getKey(), itemId);
        }
        return item;
    }

    private CatalogType requireType(UUID typeId) {
        CatalogType type = typeRepository.findById(typeId);
        if (type == null) {
            throw CatalogTypeService.notFound(ResponseKey.ID.getKey(), typeId);
        }
        return type;
    }

    static EdgeResponse toResponse(CatalogItemEdge edge) {
        return new EdgeResponse(edge.id, edge.parentItemId, edge.childItemId, edge.relationType.name(),
            edge.sortOrder, edge.status.name(), edge.validFrom, edge.validTo, edge.createdAt);
    }
}
