package com.vn9melody.openerp.modules.organization.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.security.PermissionInvalidationService;
import com.vn9melody.openerp.core.security.events.BranchAssignmentChangedEvent;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import com.vn9melody.openerp.modules.organization.dto.BranchAssignmentDtos.BranchAssignmentCreateRequest;
import com.vn9melody.openerp.modules.organization.dto.BranchAssignmentDtos.BranchAssignmentItem;
import com.vn9melody.openerp.modules.organization.dto.BranchAssignmentDtos.BranchAssignmentResponse;
import com.vn9melody.openerp.modules.organization.dto.BranchAssignmentDtos.BranchAssignmentUpdateRequest;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.model.UserBranchAssignment;
import com.vn9melody.openerp.modules.organization.repository.BranchRepository;
import com.vn9melody.openerp.modules.organization.repository.UserBranchAssignmentRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class BranchAssignmentService {

    @Inject
    UserBranchAssignmentRepository assignmentRepository;

    @Inject
    BranchRepository branchRepository;

    @Inject
    OrganizationReferenceGuard referenceGuard;

    @Inject
    PermissionInvalidationService permissionInvalidationService;

    public List<BranchAssignmentResponse> list(UUID tenantId, UUID userId, UUID branchId) {
        StringBuilder query = new StringBuilder("tenantId = ?1");
        List<Object> params = new ArrayList<>();
        params.add(tenantId);
        if (userId != null) {
            query.append(" and userId = ?").append(params.size() + 1);
            params.add(userId);
        }
        if (branchId != null) {
            query.append(" and branchId = ?").append(params.size() + 1);
            params.add(branchId);
        }
        query.append(" order by isPrimary desc, assignedAt asc");
        return toResponses(assignmentRepository.find(query.toString(), params.toArray()).list());
    }

    public UserBranchAssignment getOrThrow(UUID tenantId, UUID assignmentId) {
        UserBranchAssignment assignment = assignmentRepository
            .find("id = ?1 and tenantId = ?2", assignmentId, tenantId)
            .firstResult();
        if (assignment == null) {
            throw new ApiException(404, OrganizationErrorCodes.BRANCH_ASSIGNMENT_NOT_FOUND,
                "Branch assignment not found");
        }
        return assignment;
    }

    @Transactional
    public BranchAssignmentResponse create(UUID tenantId, BranchAssignmentCreateRequest request) {
        UUID userId = referenceGuard.parseUuid(request.userId(), "user_id");
        referenceGuard.requireUserInTenant(tenantId, userId);

        List<BranchAssignmentItem> items = new ArrayList<>();
        if (request.assignments() != null && !request.assignments().isEmpty()) {
            items.addAll(request.assignments());
        } else if (request.branchId() != null && !request.branchId().isBlank()) {
            items.add(new BranchAssignmentItem(request.branchId(), request.isPrimary(), request.canManage()));
        } else {
            throw new ApiException(400, "VALIDATION_REQUIRED", "At least one branch assignment is required");
        }

        long requestedPrimary = items.stream().filter(item -> Boolean.TRUE.equals(item.isPrimary())).count();
        if (requestedPrimary > 1) {
            throw new ApiException(400, OrganizationErrorCodes.PRIMARY_BRANCH_REQUIRED,
                "Only one primary branch assignment is allowed per user");
        }

        boolean hasPrimary = assignmentRepository.findPrimary(userId, tenantId) != null;
        UserBranchAssignment firstCreated = null;
        UserBranchAssignment primaryCreated = null;
        boolean primaryApplied = false;

        for (BranchAssignmentItem item : items) {
            UUID branchId = referenceGuard.parseUuid(item.branchId(), "branch_id");
            Branch branch = requireBranch(tenantId, branchId);

            UserBranchAssignment existing = assignmentRepository
                .find("userId = ?1 and branchId = ?2", userId, branchId)
                .firstResult();
            if (existing != null) {
                throw new ApiException(409, OrganizationErrorCodes.BRANCH_ASSIGNMENT_EXISTS,
                    "The user is already assigned to this branch");
            }

            boolean primary = Boolean.TRUE.equals(item.isPrimary());
            if (!hasPrimary && !primaryApplied) {
                primary = true;
            }
            if (primary) {
                clearPrimary(userId, tenantId, null);
                assignmentRepository.flush();
                primaryApplied = true;
            }

            UserBranchAssignment assignment = new UserBranchAssignment();
            assignment.userId = userId;
            assignment.tenantId = tenantId;
            assignment.branchId = branch.id;
            assignment.isPrimary = primary;
            assignment.canManage = item.canManage() == null || item.canManage();
            assignment.assignedAt = Instant.now();
            assignment.persist();
            if (firstCreated == null) {
                firstCreated = assignment;
            }
            if (primary) {
                primaryCreated = assignment;
            }
        }

        UserBranchAssignment responseAssignment = primaryCreated != null ? primaryCreated : firstCreated;
        permissionInvalidationService.publish(
            new BranchAssignmentChangedEvent(tenantId, userId,
                responseAssignment != null ? responseAssignment.branchId : null, "BRANCH_ASSIGNMENT_CREATED"));
        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_BRANCH_ASSIGNMENT_CREATED.
        return toResponses(List.of(responseAssignment)).get(0);
    }

    @Transactional
    public BranchAssignmentResponse update(UUID tenantId, UUID assignmentId, BranchAssignmentUpdateRequest request) {
        UserBranchAssignment assignment = getOrThrow(tenantId, assignmentId);

        if (request.canManage() != null) {
            assignment.canManage = request.canManage();
        }
        if (request.isPrimary() != null) {
            if (request.isPrimary()) {
                clearPrimary(assignment.userId, tenantId, assignment.id);
                assignmentRepository.flush();
                assignment.isPrimary = true;
            } else if (assignment.isPrimary && countByUser(assignment.userId, tenantId) > 1) {
                assignment.isPrimary = false;
            }
        }
        ensureSinglePrimary(assignment.userId, tenantId);

        permissionInvalidationService.publish(
            new BranchAssignmentChangedEvent(tenantId, assignment.userId, assignment.branchId,
                "BRANCH_ASSIGNMENT_UPDATED"));
        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_BRANCH_ASSIGNMENT_UPDATED.
        return toResponses(List.of(assignment)).get(0);
    }

    @Transactional
    public void delete(UUID tenantId, UUID assignmentId) {
        UserBranchAssignment assignment = getOrThrow(tenantId, assignmentId);

        if (assignment.isPrimary && countByUser(assignment.userId, tenantId) <= 1) {
            throw new ApiException(409, OrganizationErrorCodes.PRIMARY_BRANCH_REQUIRED,
                "The user must keep at least one primary branch assignment");
        }

        UUID userId = assignment.userId;
        UUID branchId = assignment.branchId;
        assignment.delete();
        assignmentRepository.flush();
        ensureSinglePrimary(userId, tenantId);

        permissionInvalidationService.publish(
            new BranchAssignmentChangedEvent(tenantId, userId, branchId, "BRANCH_ASSIGNMENT_REMOVED"));
        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_BRANCH_ASSIGNMENT_REMOVED.
    }

    private long countByUser(UUID userId, UUID tenantId) {
        return assignmentRepository.count("userId = ?1 and tenantId = ?2", userId, tenantId);
    }

    private void clearPrimary(UUID userId, UUID tenantId, UUID exceptAssignmentId) {
        List<UserBranchAssignment> primaries = exceptAssignmentId != null
            ? assignmentRepository.find("userId = ?1 and tenantId = ?2 and isPrimary = true and id <> ?3",
                userId, tenantId, exceptAssignmentId).list()
            : assignmentRepository.find("userId = ?1 and tenantId = ?2 and isPrimary = true",
                userId, tenantId).list();
        for (UserBranchAssignment primary : primaries) {
            primary.isPrimary = false;
        }
    }

    private void ensureSinglePrimary(UUID userId, UUID tenantId) {
        List<UserBranchAssignment> assignments = assignmentRepository.listByUser(userId, tenantId);
        if (assignments.isEmpty()) {
            return;
        }
        boolean hasPrimary = assignments.stream().anyMatch(a -> Boolean.TRUE.equals(a.isPrimary));
        if (!hasPrimary) {
            assignments.get(0).isPrimary = true;
        }
    }

    private Branch requireBranch(UUID tenantId, UUID branchId) {
        Branch branch = branchRepository.find("id = ?1 and tenantId = ?2", branchId, tenantId).firstResult();
        if (branch == null) {
            throw new ApiException(400, OrganizationErrorCodes.CROSS_TENANT_REFERENCE,
                "Referenced branch does not belong to the current tenant");
        }
        return branch;
    }

    private List<BranchAssignmentResponse> toResponses(List<UserBranchAssignment> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            return List.of();
        }
        Set<UUID> userIds = new LinkedHashSet<>();
        Set<UUID> branchIds = new LinkedHashSet<>();
        for (UserBranchAssignment assignment : assignments) {
            userIds.add(assignment.userId);
            branchIds.add(assignment.branchId);
        }
        Map<UUID, User> users = new HashMap<>();
        for (User user : User.<User>find("id in ?1", userIds).list()) {
            users.put(user.id, user);
        }
        Map<UUID, Branch> branches = new HashMap<>();
        for (Branch branch : Branch.<Branch>find("id in ?1", branchIds).list()) {
            branches.put(branch.id, branch);
        }
        Map<UUID, BranchAssignmentResponse> mapped = new LinkedHashMap<>();
        for (UserBranchAssignment assignment : assignments) {
            User user = users.get(assignment.userId);
            Branch branch = branches.get(assignment.branchId);
            mapped.put(assignment.id, new BranchAssignmentResponse(
                assignment.id.toString(),
                assignment.userId.toString(),
                user != null ? user.email : null,
                assignment.branchId.toString(),
                branch != null ? branch.code : null,
                assignment.isPrimary,
                assignment.canManage
            ));
        }
        return new ArrayList<>(mapped.values());
    }
}
