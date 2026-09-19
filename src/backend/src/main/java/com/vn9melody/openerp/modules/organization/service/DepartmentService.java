package com.vn9melody.openerp.modules.organization.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import com.vn9melody.openerp.modules.organization.dto.DepartmentDtos.DepartmentMoveRequest;
import com.vn9melody.openerp.modules.organization.dto.DepartmentDtos.DepartmentNodeResponse;
import com.vn9melody.openerp.modules.organization.dto.DepartmentDtos.DepartmentRequest;
import com.vn9melody.openerp.modules.organization.dto.MembershipDtos.MembershipResponse;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.model.Department;
import com.vn9melody.openerp.modules.organization.repository.BranchRepository;
import com.vn9melody.openerp.modules.organization.repository.DepartmentRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class DepartmentService {

    public static final int MAX_DEPTH = 5;

    @Inject
    DepartmentRepository departmentRepository;

    @Inject
    BranchRepository branchRepository;

    @Inject
    OrganizationReferenceGuard referenceGuard;

    @Inject
    MembershipService membershipService;

    public List<DepartmentNodeResponse> tree(UUID tenantId) {
        List<Department> departments = activeDepartments(tenantId);
        Map<UUID, Department> byId = new HashMap<>();
        Map<UUID, List<Department>> childrenByParent = new HashMap<>();
        for (Department department : departments) {
            byId.put(department.id, department);
        }
        List<Department> roots = new ArrayList<>();
        for (Department department : departments) {
            if (department.parentId == null || !byId.containsKey(department.parentId)) {
                roots.add(department);
            } else {
                childrenByParent.computeIfAbsent(department.parentId, key -> new ArrayList<>()).add(department);
            }
        }
        Map<UUID, String> branchNames = branchNames(tenantId);
        Map<UUID, String> managerNames = managerNames(departments);
        return roots.stream()
            .sorted(Comparator.comparing(department -> department.code))
            .map(department -> toNode(department, childrenByParent, branchNames, managerNames))
            .toList();
    }

    public Department getOrThrow(UUID tenantId, UUID departmentId) {
        Department department = find(tenantId, departmentId);
        if (department == null) {
            throw new ApiException(404, OrganizationErrorCodes.DEPARTMENT_NOT_FOUND, "Department not found");
        }
        return department;
    }

    public Department find(UUID tenantId, UUID departmentId) {
        if (departmentId == null) {
            return null;
        }
        return departmentRepository.find("id = ?1 and tenantId = ?2", departmentId, tenantId).firstResult();
    }

    public List<MembershipResponse> members(UUID tenantId, UUID departmentId) {
        getOrThrow(tenantId, departmentId);
        return membershipService.list(tenantId, null, null, departmentId);
    }

    @Transactional
    public DepartmentNodeResponse create(UUID tenantId, DepartmentRequest request) {
        String code = normalizeCode(request.code());
        if (departmentRepository.findByTenantAndCode(tenantId, code) != null) {
            throw new ApiException(409, OrganizationErrorCodes.DEPARTMENT_CODE_EXISTS,
                "Department code already exists in this tenant");
        }

        UUID branchId = referenceGuard.parseUuid(request.branchId(), "branch_id");
        UUID parentId = referenceGuard.parseUuid(request.parentId(), "parent_id");
        UUID managerId = referenceGuard.parseUuid(request.managerUserId(), "manager_user_id");

        Branch branch = branchId != null ? requireBranch(tenantId, branchId) : null;
        Department parent = parentId != null ? requireDepartment(tenantId, parentId) : null;
        if (managerId != null) {
            referenceGuard.requireUserInTenant(tenantId, managerId);
        }

        Map<UUID, Department> byId = byId(tenantId);
        int parentDepth = parent != null ? depthOf(parent, byId) : 0;
        if (parentDepth + 1 > MAX_DEPTH) {
            throw depthExceeded();
        }

        Department department = new Department();
        department.tenantId = tenantId;
        department.branchId = branch != null ? branch.id : null;
        department.parentId = parent != null ? parent.id : null;
        department.code = code;
        department.name = request.name().trim();
        department.managerUserId = managerId;
        department.status = request.status() != null && !request.status().isBlank()
            ? request.status().trim().toUpperCase()
            : BranchService.STATUS_ACTIVE;
        department.createdAt = Instant.now();
        department.updatedAt = department.createdAt;
        department.persist();

        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_DEPARTMENT_CREATED.
        return tree(tenantId).stream()
            .flatMap(node -> flatten(node).stream())
            .filter(node -> node.id().equals(department.id.toString()))
            .findFirst()
            .orElseThrow();
    }

    @Transactional
    public DepartmentNodeResponse update(UUID tenantId, UUID departmentId, DepartmentRequest request) {
        Department department = getOrThrow(tenantId, departmentId);
        String code = normalizeCode(request.code());
        Department existing = departmentRepository.findByTenantAndCode(tenantId, code);
        if (existing != null && !existing.id.equals(department.id)) {
            throw new ApiException(409, OrganizationErrorCodes.DEPARTMENT_CODE_EXISTS,
                "Department code already exists in this tenant");
        }

        UUID branchId = referenceGuard.parseUuid(request.branchId(), "branch_id");
        UUID parentId = referenceGuard.parseUuid(request.parentId(), "parent_id");
        UUID managerId = referenceGuard.parseUuid(request.managerUserId(), "manager_user_id");

        Branch branch = branchId != null ? requireBranch(tenantId, branchId) : null;
        Department parent = parentId != null ? requireDepartment(tenantId, parentId) : null;
        if (managerId != null) {
            referenceGuard.requireUserInTenant(tenantId, managerId);
        }

        Map<UUID, Department> byId = byId(tenantId);
        if (parent != null) {
            if (parent.id.equals(department.id) || isDescendant(department.id, parent.id, byId)) {
                throw cycleDetected();
            }
        }
        int parentDepth = parent != null ? depthOf(parent, byId) : 0;
        if (parentDepth + 1 + subtreeHeight(department.id, byId) > MAX_DEPTH) {
            throw depthExceeded();
        }

        UUID newBranchId = branch != null ? branch.id : null;
        if (!Objects.equals(department.branchId, newBranchId) && newBranchId != null) {
            membershipService.moveDepartmentMembersToBranch(tenantId, department.id, newBranchId);
        }

        department.code = code;
        department.name = request.name().trim();
        department.branchId = newBranchId;
        department.parentId = parent != null ? parent.id : null;
        department.managerUserId = managerId;
        if (request.status() != null && !request.status().isBlank()) {
            department.status = request.status().trim().toUpperCase();
        }
        department.updatedAt = Instant.now();

        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_DEPARTMENT_UPDATED.
        return nodeById(tenantId, department.id);
    }

    @Transactional
    public DepartmentNodeResponse move(UUID tenantId, UUID departmentId, DepartmentMoveRequest request) {
        Department department = getOrThrow(tenantId, departmentId);
        UUID newParentId = referenceGuard.parseUuid(request.newParentId(), "new_parent_id");
        UUID reassignMembersTo = referenceGuard.parseUuid(request.reassignMembersTo(), "reassign_members_to");

        Department newParent = newParentId != null ? requireDepartment(tenantId, newParentId) : null;
        Map<UUID, Department> byId = byId(tenantId);

        if (newParent != null) {
            if (newParent.id.equals(department.id) || isDescendant(department.id, newParent.id, byId)) {
                throw cycleDetected();
            }
        }

        int parentDepth = newParent != null ? depthOf(newParent, byId) : 0;
        if (parentDepth + 1 + subtreeHeight(department.id, byId) > MAX_DEPTH) {
            throw depthExceeded();
        }

        UUID currentBranchId = department.branchId;
        UUID targetBranchId = newParent != null ? newParent.branchId : currentBranchId;
        if (targetBranchId != null && !Objects.equals(currentBranchId, targetBranchId)) {
            if (reassignMembersTo != null) {
                Department target = requireDepartment(tenantId, reassignMembersTo);
                if (target.id.equals(department.id)) {
                    throw new ApiException(400, OrganizationErrorCodes.CROSS_TENANT_REFERENCE,
                        "reassign_members_to must reference another department");
                }
                membershipService.reassignDepartmentMembers(tenantId, department.id, target.id);
            } else {
                membershipService.moveDepartmentMembersToBranch(tenantId, department.id, targetBranchId);
            }
        }

        department.parentId = newParent != null ? newParent.id : null;
        department.branchId = targetBranchId;
        department.updatedAt = Instant.now();

        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_DEPARTMENT_MOVED.
        return nodeById(tenantId, department.id);
    }

    @Transactional
    public void softDelete(UUID tenantId, UUID departmentId) {
        Department department = getOrThrow(tenantId, departmentId);

        long children = departmentRepository.count(
            "tenantId = ?1 and parentId = ?2 and status <> ?3", tenantId, departmentId, BranchService.STATUS_INACTIVE);
        long memberships = membershipService.countByDepartment(tenantId, departmentId);
        if (children > 0 || memberships > 0) {
            throw new ApiException(409, OrganizationErrorCodes.DEPARTMENT_IN_USE,
                "Cannot delete a department that still has sub-departments or members");
        }

        department.status = BranchService.STATUS_INACTIVE;
        department.updatedAt = Instant.now();
        // TODO(wave-integration): emit tenant-scoped audit log for ORGANIZATION_DEPARTMENT_DELETED.
    }

    private List<Department> activeDepartments(UUID tenantId) {        return departmentRepository.find("tenantId = ?1 and status <> ?2 order by code asc",
            tenantId, BranchService.STATUS_INACTIVE).list();
    }

    private Map<UUID, Department> byId(UUID tenantId) {
        Map<UUID, Department> byId = new HashMap<>();
        for (Department department : activeDepartments(tenantId)) {
            byId.put(department.id, department);
        }
        return byId;
    }

    private int depthOf(Department department, Map<UUID, Department> byId) {
        int depth = 1;
        Set<UUID> visited = new HashSet<>();
        Department current = department;
        while (current != null && current.parentId != null) {
            if (!visited.add(current.id)) {
                break;
            }
            Department parent = byId.get(current.parentId);
            if (parent == null) {
                break;
            }
            depth++;
            current = parent;
        }
        return depth;
    }

    private int subtreeHeight(UUID departmentId, Map<UUID, Department> byId) {
        int max = 0;
        for (Department candidate : byId.values()) {
            if (departmentId.equals(candidate.parentId)) {
                max = Math.max(max, 1 + subtreeHeight(candidate.id, byId));
            }
        }
        return max;
    }

    private boolean isDescendant(UUID ancestorId, UUID candidateId, Map<UUID, Department> byId) {
        Department current = byId.get(candidateId);
        Set<UUID> visited = new HashSet<>();
        while (current != null && current.parentId != null) {
            if (!visited.add(current.id)) {
                return false;
            }
            if (ancestorId.equals(current.parentId)) {
                return true;
            }
            current = byId.get(current.parentId);
        }
        return false;
    }

    private DepartmentNodeResponse nodeById(UUID tenantId, UUID departmentId) {
        return tree(tenantId).stream()
            .flatMap(node -> flatten(node).stream())
            .filter(node -> node.id().equals(departmentId.toString()))
            .findFirst()
            .orElseThrow(() -> new ApiException(404, OrganizationErrorCodes.DEPARTMENT_NOT_FOUND, "Department not found"));
    }

    private List<DepartmentNodeResponse> flatten(DepartmentNodeResponse node) {
        List<DepartmentNodeResponse> all = new ArrayList<>();
        all.add(node);
        for (DepartmentNodeResponse child : node.children()) {
            all.addAll(flatten(child));
        }
        return all;
    }

    private DepartmentNodeResponse toNode(Department department,
                                          Map<UUID, List<Department>> childrenByParent,
                                          Map<UUID, String> branchNames,
                                          Map<UUID, String> managerNames) {
        List<DepartmentNodeResponse> children = childrenByParent.getOrDefault(department.id, List.of()).stream()
            .sorted(Comparator.comparing(child -> child.code))
            .map(child -> toNode(child, childrenByParent, branchNames, managerNames))
            .toList();
        return new DepartmentNodeResponse(
            department.id.toString(),
            department.code,
            department.name,
            department.branchId != null ? department.branchId.toString() : null,
            department.branchId != null ? branchNames.get(department.branchId) : null,
            department.parentId != null ? department.parentId.toString() : null,
            department.managerUserId != null ? department.managerUserId.toString() : null,
            department.managerUserId != null ? managerNames.get(department.managerUserId) : null,
            department.status,
            children
        );
    }

    private Map<UUID, String> branchNames(UUID tenantId) {
        Map<UUID, String> names = new HashMap<>();
        for (Branch branch : branchRepository.findByTenant(tenantId)) {
            names.put(branch.id, branch.name);
        }
        return names;
    }

    private Map<UUID, String> managerNames(List<Department> departments) {
        Set<UUID> managerIds = new LinkedHashSet<>();
        for (Department department : departments) {
            if (department.managerUserId != null) {
                managerIds.add(department.managerUserId);
            }
        }
        Map<UUID, String> names = new HashMap<>();
        if (managerIds.isEmpty()) {
            return names;
        }
        for (UserProfile profile : UserProfile.<UserProfile>find("userId in ?1", managerIds).list()) {
            names.put(profile.userId, profile.fullName);
        }
        return names;
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
        Department department = find(tenantId, departmentId);
        if (department == null) {
            throw new ApiException(400, OrganizationErrorCodes.CROSS_TENANT_REFERENCE,
                "Referenced department does not belong to the current tenant");
        }
        return department;
    }

    private ApiException cycleDetected() {
        return new ApiException(400, OrganizationErrorCodes.DEPARTMENT_CYCLE_DETECTED,
            "Moving this department would create a circular loop in the department tree");
    }

    private ApiException depthExceeded() {
        return new ApiException(400, OrganizationErrorCodes.DEPARTMENT_DEPTH_EXCEEDED,
            "Department hierarchy depth cannot exceed " + MAX_DEPTH + " levels");
    }

    public static String normalizeCode(String value) {
        if (value == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "Department code is required");
        }
        return value.trim().toUpperCase();
    }
}
