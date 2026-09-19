package com.vn9melody.openerp.modules.organization.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.security.PermissionInvalidationService;
import com.vn9melody.openerp.core.security.events.UserDepartmentTransferredEvent;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import com.vn9melody.openerp.modules.organization.dto.MembershipDtos.MembershipRequest;
import com.vn9melody.openerp.modules.organization.dto.MembershipDtos.MembershipResponse;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.model.Department;
import com.vn9melody.openerp.modules.organization.model.UserDepartmentMembership;
import com.vn9melody.openerp.modules.organization.repository.BranchRepository;
import com.vn9melody.openerp.modules.organization.repository.DepartmentRepository;
import com.vn9melody.openerp.modules.organization.repository.UserDepartmentMembershipRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class MembershipService {

    public static final String STATUS_ACTIVE = "ACTIVE";

    @Inject
    UserDepartmentMembershipRepository membershipRepository;

    @Inject
    BranchRepository branchRepository;

    @Inject
    DepartmentRepository departmentRepository;

    @Inject
    OrganizationReferenceGuard referenceGuard;

    @Inject
    PermissionInvalidationService permissionInvalidationService;

    public List<MembershipResponse> list(UUID tenantId, UUID userId, UUID branchId, UUID departmentId) {
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
        if (departmentId != null) {
            query.append(" and departmentId = ?").append(params.size() + 1);
            params.add(departmentId);
        }
        query.append(" order by isPrimary desc, joinedAt asc");
        return toResponses(membershipRepository.find(query.toString(), params.toArray()).list());
    }

    public UserDepartmentMembership getOrThrow(UUID tenantId, UUID membershipId) {
        UserDepartmentMembership membership = membershipRepository
            .find("id = ?1 and tenantId = ?2", membershipId, tenantId)
            .firstResult();
        if (membership == null) {
            throw new ApiException(404, OrganizationErrorCodes.MEMBERSHIP_NOT_FOUND, "Membership not found");
        }
        return membership;
    }

    @Transactional
    public MembershipResponse create(UUID tenantId, MembershipRequest request) {
        UUID userId = referenceGuard.parseUuid(request.userId(), "user_id");
        UUID branchId = referenceGuard.parseUuid(request.branchId(), "branch_id");
        UUID departmentId = referenceGuard.parseUuid(request.departmentId(), "department_id");
        UUID managerId = referenceGuard.parseUuid(request.directManagerUserId(), "direct_manager_user_id");

        referenceGuard.requireUserInTenant(tenantId, userId);
        Branch branch = requireBranch(tenantId, branchId);
        Department department = requireDepartment(tenantId, departmentId);
        requireBranchMatchesDepartment(department, branch.id);

        if (managerId != null) {
            referenceGuard.requireUserInTenant(tenantId, managerId);
            if (wouldCreateReportingCycle(tenantId, userId, managerId)) {
                throw reportingCycle(userId, managerId);
            }
        }

        if (membershipRepository.find("userId = ?1 and departmentId = ?2", userId, departmentId).firstResult() != null) {
            throw new ApiException(409, OrganizationErrorCodes.MEMBERSHIP_EXISTS,
                "The user is already a member of this department");
        }

        boolean hasPrimary = membershipRepository.findPrimary(userId, tenantId) != null;
        boolean primary = !hasPrimary || Boolean.TRUE.equals(request.isPrimary());
        if (primary) {
            clearPrimary(userId, tenantId, null);
            membershipRepository.flush();
        }

        UserDepartmentMembership membership = new UserDepartmentMembership();
        membership.userId = userId;
        membership.tenantId = tenantId;
        membership.branchId = branch.id;
        membership.departmentId = department.id;
        membership.directManagerUserId = managerId;
        membership.title = request.title();
        membership.isPrimary = primary;
        membership.joinedAt = Instant.now();
        membership.persist();

        permissionInvalidationService.publish(
            new UserDepartmentTransferredEvent(tenantId, userId, null, department.id, "MEMBERSHIP_CREATED"));
        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_MEMBERSHIP_CREATED.
        return toResponses(List.of(membership)).get(0);
    }

    @Transactional
    public MembershipResponse update(UUID tenantId, UUID membershipId, MembershipRequest request) {
        UserDepartmentMembership membership = getOrThrow(tenantId, membershipId);

        UUID userId = request.userId() != null
            ? referenceGuard.parseUuid(request.userId(), "user_id")
            : membership.userId;
        UUID branchId = request.branchId() != null
            ? referenceGuard.parseUuid(request.branchId(), "branch_id")
            : membership.branchId;
        UUID departmentId = request.departmentId() != null
            ? referenceGuard.parseUuid(request.departmentId(), "department_id")
            : membership.departmentId;
        UUID managerId = referenceGuard.parseUuid(request.directManagerUserId(), "direct_manager_user_id");

        referenceGuard.requireUserInTenant(tenantId, userId);
        Branch branch = requireBranch(tenantId, branchId);
        Department department = requireDepartment(tenantId, departmentId);
        requireBranchMatchesDepartment(department, branch.id);

        if (managerId != null) {
            referenceGuard.requireUserInTenant(tenantId, managerId);
            if (wouldCreateReportingCycle(tenantId, userId, managerId)) {
                throw reportingCycle(userId, managerId);
            }
        }

        UUID previousDepartmentId = membership.departmentId;
        membership.userId = userId;
        membership.branchId = branch.id;
        membership.departmentId = department.id;
        membership.directManagerUserId = managerId;
        if (request.title() != null) {
            membership.title = request.title();
        }

        if (request.isPrimary() != null) {
            if (request.isPrimary()) {
                clearPrimary(userId, tenantId, membership.id);
                membershipRepository.flush();
                membership.isPrimary = true;
            } else if (membership.isPrimary && countByUser(userId, tenantId) > 1) {
                membership.isPrimary = false;
            }
        }
        ensureSinglePrimary(userId, tenantId);

        permissionInvalidationService.publish(
            new UserDepartmentTransferredEvent(tenantId, userId, previousDepartmentId, department.id,
                "MEMBERSHIP_UPDATED"));
        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_MEMBERSHIP_UPDATED.
        return toResponses(List.of(membership)).get(0);
    }

    @Transactional
    public void delete(UUID tenantId, UUID membershipId, UUID transferToUserId) {
        UserDepartmentMembership membership = getOrThrow(tenantId, membershipId);

        if (transferToUserId != null) {
            referenceGuard.requireUserInTenant(tenantId, transferToUserId);
            membershipRepository.update(
                "directManagerUserId = ?1 where tenantId = ?2 and directManagerUserId = ?3",
                transferToUserId, tenantId, membership.userId);
        }

        if (membership.isPrimary) {
            if (countByUser(membership.userId, tenantId) <= 1) {
                throw new ApiException(409, OrganizationErrorCodes.PRIMARY_REQUIRED,
                    "The user must keep at least one primary membership");
            }
        }

        UUID userId = membership.userId;
        UUID departmentId = membership.departmentId;
        membership.delete();
        membershipRepository.flush();
        ensureSinglePrimary(userId, tenantId);

        permissionInvalidationService.publish(
            new UserDepartmentTransferredEvent(tenantId, userId, departmentId, null, "MEMBERSHIP_REMOVED"));
        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_MEMBERSHIP_REMOVED.
    }

    public long countByDepartment(UUID tenantId, UUID departmentId) {
        return membershipRepository.count("tenantId = ?1 and departmentId = ?2", tenantId, departmentId);
    }

    public long countByBranch(UUID tenantId, UUID branchId) {
        return membershipRepository.count("tenantId = ?1 and branchId = ?2", tenantId, branchId);
    }

    /**
     * Reassigns every membership of a department to another department (used when a department
     * is moved to a different branch and the caller supplied {@code reassign_members_to}).
     */
    @Transactional
    public void reassignDepartmentMembers(UUID tenantId, UUID fromDepartmentId, UUID toDepartmentId) {
        Department target = requireDepartment(tenantId, toDepartmentId);
        List<UserDepartmentMembership> memberships = membershipRepository.listByDepartment(tenantId, fromDepartmentId);
        for (UserDepartmentMembership membership : memberships) {
            membership.departmentId = target.id;
            if (target.branchId != null) {
                membership.branchId = target.branchId;
            }
        }
    }

    /**
     * Moves every membership of a department to a new branch, keeping the BR-RBAC-10 invariant
     * (membership.branch_id must match departments.branch_id when the department is branch-bound).
     */
    @Transactional
    public void moveDepartmentMembersToBranch(UUID tenantId, UUID departmentId, UUID branchId) {
        List<UserDepartmentMembership> memberships = membershipRepository.listByDepartment(tenantId, departmentId);
        for (UserDepartmentMembership membership : memberships) {
            membership.branchId = branchId;
        }
    }

    public boolean wouldCreateReportingCycle(UUID tenantId, UUID employeeId, UUID proposedManagerId) {
        if (employeeId == null || proposedManagerId == null) {
            return false;
        }
        if (employeeId.equals(proposedManagerId)) {
            return true;
        }
        Set<UUID> visited = new HashSet<>();
        Deque<UUID> queue = new ArrayDeque<>();
        queue.add(proposedManagerId);
        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            if (current.equals(employeeId)) {
                return true;
            }
            if (!visited.add(current)) {
                continue;
            }
            UUID nextManager = resolveDirectManager(tenantId, current);
            if (nextManager != null) {
                queue.add(nextManager);
            }
        }
        return false;
    }

    private UUID resolveDirectManager(UUID tenantId, UUID userId) {
        UserDepartmentMembership primary = membershipRepository.findPrimary(userId, tenantId);
        if (primary != null && primary.directManagerUserId != null) {
            return primary.directManagerUserId;
        }
        for (UserDepartmentMembership membership : membershipRepository.listByUser(userId, tenantId)) {
            if (membership.directManagerUserId != null) {
                return membership.directManagerUserId;
            }
        }
        return null;
    }

    private ApiException reportingCycle(UUID employeeId, UUID managerId) {
        List<com.vn9melody.openerp.core.api.ApiFieldError> errors = List.of(
            new com.vn9melody.openerp.core.api.ApiFieldError(
                "direct_manager_user_id",
                OrganizationErrorCodes.VALIDATION_MANAGEMENT_CYCLE_FORBIDDEN,
                Map.of("cycle_with", managerId.toString())));
        return new ApiException(400, OrganizationErrorCodes.REPORTING_CYCLE_DETECTED,
            "A circular reporting loop was detected in the management hierarchy",
            Map.of("employee_id", employeeId.toString(), "proposed_manager_id", managerId.toString()),
            errors);
    }

    private long countByUser(UUID userId, UUID tenantId) {
        return membershipRepository.count("userId = ?1 and tenantId = ?2", userId, tenantId);
    }

    private void clearPrimary(UUID userId, UUID tenantId, UUID exceptMembershipId) {
        StringBuilder query = new StringBuilder("userId = ?1 and tenantId = ?2 and isPrimary = true");
        if (exceptMembershipId != null) {
            query.append(" and id <> ?3");
        }
        List<UserDepartmentMembership> primaries = exceptMembershipId != null
            ? membershipRepository.find(query.toString(), userId, tenantId, exceptMembershipId).list()
            : membershipRepository.find(query.toString(), userId, tenantId).list();
        for (UserDepartmentMembership primary : primaries) {
            primary.isPrimary = false;
        }
    }

    private void ensureSinglePrimary(UUID userId, UUID tenantId) {
        List<UserDepartmentMembership> memberships = membershipRepository.listByUser(userId, tenantId);
        if (memberships.isEmpty()) {
            return;
        }
        boolean hasPrimary = memberships.stream().anyMatch(m -> Boolean.TRUE.equals(m.isPrimary));
        if (!hasPrimary) {
            memberships.get(0).isPrimary = true;
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

    private Department requireDepartment(UUID tenantId, UUID departmentId) {
        Department department = departmentRepository.find("id = ?1 and tenantId = ?2", departmentId, tenantId).firstResult();
        if (department == null) {
            throw new ApiException(400, OrganizationErrorCodes.CROSS_TENANT_REFERENCE,
                "Referenced department does not belong to the current tenant");
        }
        return department;
    }

    private void requireBranchMatchesDepartment(Department department, UUID branchId) {
        if (department.branchId != null && !department.branchId.equals(branchId)) {
            throw new ApiException(400, OrganizationErrorCodes.MEMBERSHIP_BRANCH_MISMATCH,
                "Membership branch must match the department branch");
        }
    }

    private List<MembershipResponse> toResponses(List<UserDepartmentMembership> memberships) {
        if (memberships == null || memberships.isEmpty()) {
            return List.of();
        }
        Set<UUID> userIds = new LinkedHashSet<>();
        Set<UUID> branchIds = new LinkedHashSet<>();
        Set<UUID> departmentIds = new LinkedHashSet<>();
        for (UserDepartmentMembership membership : memberships) {
            userIds.add(membership.userId);
            if (membership.directManagerUserId != null) {
                userIds.add(membership.directManagerUserId);
            }
            branchIds.add(membership.branchId);
            departmentIds.add(membership.departmentId);
        }

        Map<UUID, User> users = new HashMap<>();
        for (User user : User.<User>find("id in ?1", userIds).list()) {
            users.put(user.id, user);
        }
        Map<UUID, UserProfile> profiles = new HashMap<>();
        for (UserProfile profile : UserProfile.<UserProfile>find("userId in ?1", userIds).list()) {
            profiles.put(profile.userId, profile);
        }
        Map<UUID, Branch> branches = new HashMap<>();
        for (Branch branch : Branch.<Branch>find("id in ?1", branchIds).list()) {
            branches.put(branch.id, branch);
        }
        Map<UUID, Department> departments = new HashMap<>();
        for (Department department : Department.<Department>find("id in ?1", departmentIds).list()) {
            departments.put(department.id, department);
        }

        Map<UUID, MembershipResponse> mapped = new LinkedHashMap<>();
        for (UserDepartmentMembership membership : memberships) {
            User user = users.get(membership.userId);
            UserProfile profile = profiles.get(membership.userId);
            UserProfile managerProfile = membership.directManagerUserId != null
                ? profiles.get(membership.directManagerUserId)
                : null;
            Branch branch = branches.get(membership.branchId);
            Department department = departments.get(membership.departmentId);
            mapped.put(membership.id, new MembershipResponse(
                membership.id.toString(),
                membership.userId.toString(),
                user != null ? user.email : null,
                profile != null ? profile.fullName : null,
                membership.branchId.toString(),
                branch != null ? branch.name : null,
                membership.departmentId.toString(),
                department != null ? department.name : null,
                membership.directManagerUserId != null ? membership.directManagerUserId.toString() : null,
                managerProfile != null ? managerProfile.fullName : null,
                membership.title,
                membership.isPrimary,
                membership.joinedAt != null ? membership.joinedAt.toString() : null
            ));
        }
        return new ArrayList<>(mapped.values());
    }
}
