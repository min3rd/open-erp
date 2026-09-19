package com.vn9melody.openerp.modules.organization.service;

import com.vn9melody.openerp.core.audit.AuditTrail;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import com.vn9melody.openerp.modules.organization.dto.BranchDtos.BranchRequest;
import com.vn9melody.openerp.modules.organization.dto.BranchDtos.BranchResponse;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.repository.BranchRepository;
import com.vn9melody.openerp.modules.organization.repository.DepartmentRepository;
import com.vn9melody.openerp.modules.organization.repository.UserBranchAssignmentRepository;
import com.vn9melody.openerp.modules.organization.repository.UserDepartmentMembershipRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class BranchService {
    @Inject
    AuditTrail auditTrail;


    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    @Inject
    BranchRepository branchRepository;

    @Inject
    DepartmentRepository departmentRepository;

    @Inject
    UserDepartmentMembershipRepository membershipRepository;

    @Inject
    UserBranchAssignmentRepository branchAssignmentRepository;

    public List<BranchResponse> list(UUID tenantId) {
        return branchRepository.findByTenant(tenantId).stream()
            .map(BranchResponse::from)
            .toList();
    }

    public Branch getOrThrow(UUID tenantId, UUID branchId) {
        Branch branch = find(tenantId, branchId);
        if (branch == null) {
            throw new ApiException(404, OrganizationErrorCodes.BRANCH_NOT_FOUND, "Branch not found");
        }
        return branch;
    }

    public Branch find(UUID tenantId, UUID branchId) {
        if (branchId == null) {
            return null;
        }
        return branchRepository.find("id = ?1 and tenantId = ?2", branchId, tenantId).firstResult();
    }

    @Transactional
    public BranchResponse create(UUID tenantId, BranchRequest request) {
        String code = normalizeCode(request.code());
        if (branchRepository.findByTenantAndCode(tenantId, code) != null) {
            throw new ApiException(409, OrganizationErrorCodes.BRANCH_CODE_EXISTS, "Branch code already exists in this tenant");
        }

        Branch branch = new Branch();
        branch.tenantId = tenantId;
        branch.code = code;
        branch.name = request.name().trim();
        branch.phone = request.phone();
        branch.address = request.address();
        branch.isDefault = branchRepository.countByTenant(tenantId) == 0;
        branch.status = STATUS_ACTIVE;
        branch.createdAt = Instant.now();
        branch.updatedAt = branch.createdAt;
        branch.persist();

        auditTrail.recordSuccess(tenantId, PlatformAction.ORG_BRANCH_CREATE, "BRANCH", branch.id,
            Map.of(ResponseKey.CODE.getKey(), branch.code));
        return BranchResponse.from(branch);
    }

    @Transactional
    public BranchResponse update(UUID tenantId, UUID branchId, BranchRequest request) {
        Branch branch = getOrThrow(tenantId, branchId);
        String code = normalizeCode(request.code());
        Branch existing = branchRepository.findByTenantAndCode(tenantId, code);
        if (existing != null && !existing.id.equals(branch.id)) {
            throw new ApiException(409, OrganizationErrorCodes.BRANCH_CODE_EXISTS, "Branch code already exists in this tenant");
        }

        branch.code = code;
        branch.name = request.name().trim();
        branch.phone = request.phone();
        branch.address = request.address();
        if (request.status() != null && !request.status().isBlank()) {
            branch.status = request.status().trim().toUpperCase();
        }
        branch.updatedAt = Instant.now();

        auditTrail.recordSuccess(tenantId, PlatformAction.ORG_BRANCH_UPDATE, "BRANCH", branch.id,
            Map.of(ResponseKey.CODE.getKey(), branch.code));
        return BranchResponse.from(branch);
    }

    @Transactional
    public void softDelete(UUID tenantId, UUID branchId) {
        Branch branch = getOrThrow(tenantId, branchId);

        long memberships = membershipRepository.count("tenantId = ?1 and branchId = ?2", tenantId, branchId);
        long assignments = branchAssignmentRepository.count("tenantId = ?1 and branchId = ?2", tenantId, branchId);
        if (memberships > 0 || assignments > 0) {
            throw new ApiException(409, OrganizationErrorCodes.BRANCH_HAS_MEMBERS,
                "Cannot delete a branch that still has active members");
        }

        long departments = departmentRepository.count("tenantId = ?1 and branchId = ?2", tenantId, branchId);
        if (departments > 0) {
            throw new ApiException(409, OrganizationErrorCodes.BRANCH_IN_USE,
                "Cannot delete a branch that is still referenced by departments");
        }

        branch.status = STATUS_INACTIVE;
        branch.updatedAt = Instant.now();
        auditTrail.recordSuccess(tenantId, PlatformAction.ORG_BRANCH_DELETE, "BRANCH", branch.id,
            Map.of(ResponseKey.CODE.getKey(), branch.code));
    }

    public static String normalizeCode(String value) {
        if (value == null) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, "Branch code is required");
        }
        return value.trim().toUpperCase();
    }
}
