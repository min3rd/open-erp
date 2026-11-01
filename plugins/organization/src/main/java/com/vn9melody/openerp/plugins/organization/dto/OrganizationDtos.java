package com.vn9melody.openerp.plugins.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugins.organization.model.OrgBranch;
import com.vn9melody.openerp.plugins.organization.model.OrgBranchAccess;
import com.vn9melody.openerp.plugins.organization.model.OrgDepartment;
import com.vn9melody.openerp.plugins.organization.model.OrgMembership;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class OrganizationDtos {

    private OrganizationDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchResponse(
        @JsonProperty("id") String id,
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("phone") String phone,
        @JsonProperty("address") String address,
        @JsonProperty("is_default") Boolean isDefault,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static BranchResponse from(OrgBranch item) {
            return new BranchResponse(
                item.id == null ? null : item.id.toString(),
                item.code, item.name, item.phone, item.address,
                item.isDefault, item.status, item.createdAt);
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DepartmentResponse(
        @JsonProperty("id") String id,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("parent_id") String parentId,
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("manager_user_id") String managerUserId,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static DepartmentResponse from(OrgDepartment item) {
            return new DepartmentResponse(
                item.id == null ? null : item.id.toString(),
                item.branchId == null ? null : item.branchId.toString(),
                item.parentId == null ? null : item.parentId.toString(),
                item.code, item.name,
                item.managerUserId == null ? null : item.managerUserId.toString(),
                item.status, item.createdAt);
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MembershipResponse(
        @JsonProperty("id") String id,
        @JsonProperty("user_id") String userId,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("department_id") String departmentId,
        @JsonProperty("direct_manager_user_id") String directManagerUserId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("joined_at") Instant joinedAt,
        @JsonProperty("valid_from") LocalDate validFrom,
        @JsonProperty("valid_to") LocalDate validTo,
        @JsonProperty("status") String status
    ) {
        public static MembershipResponse from(OrgMembership item) {
            return new MembershipResponse(
                item.id == null ? null : item.id.toString(),
                item.userId == null ? null : item.userId.toString(),
                item.branchId == null ? null : item.branchId.toString(),
                item.departmentId == null ? null : item.departmentId.toString(),
                item.directManagerUserId == null ? null : item.directManagerUserId.toString(),
                item.isPrimary, item.joinedAt, item.validFrom, item.validTo, item.status);
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAccessResponse(
        @JsonProperty("id") String id,
        @JsonProperty("user_id") String userId,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("can_manage") Boolean canManage,
        @JsonProperty("assigned_at") Instant assignedAt,
        @JsonProperty("valid_from") LocalDate validFrom,
        @JsonProperty("valid_to") LocalDate validTo,
        @JsonProperty("status") String status
    ) {
        public static BranchAccessResponse from(OrgBranchAccess item) {
            return new BranchAccessResponse(
                item.id == null ? null : item.id.toString(),
                item.userId == null ? null : item.userId.toString(),
                item.branchId == null ? null : item.branchId.toString(),
                item.isPrimary, item.canManage, item.assignedAt,
                item.validFrom, item.validTo, item.status);
        }
    }

    public record BranchRequest(
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("phone") String phone,
        @JsonProperty("address") String address,
        @JsonProperty("is_default") Boolean isDefault,
        @JsonProperty("status") String status
    ) {
    }

    public record DepartmentRequest(
        @JsonProperty("branch_id") UUID branchId,
        @JsonProperty("parent_id") UUID parentId,
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("manager_user_id") UUID managerUserId,
        @JsonProperty("status") String status
    ) {
    }

    public record MembershipRequest(
        @JsonProperty("user_id") UUID userId,
        @JsonProperty("branch_id") UUID branchId,
        @JsonProperty("department_id") UUID departmentId,
        @JsonProperty("direct_manager_user_id") UUID directManagerUserId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("valid_from") LocalDate validFrom,
        @JsonProperty("valid_to") LocalDate validTo,
        @JsonProperty("status") String status
    ) {
    }

    public record BranchAccessRequest(
        @JsonProperty("user_id") UUID userId,
        @JsonProperty("branch_id") UUID branchId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("can_manage") Boolean canManage,
        @JsonProperty("valid_from") LocalDate validFrom,
        @JsonProperty("valid_to") LocalDate validTo,
        @JsonProperty("status") String status
    ) {
    }

    public record BootstrapResult(
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("department_id") String departmentId,
        @JsonProperty("membership_id") String membershipId,
        @JsonProperty("created") boolean created
    ) {
    }
}
