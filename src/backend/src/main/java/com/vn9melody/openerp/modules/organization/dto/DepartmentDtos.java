package com.vn9melody.openerp.modules.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class DepartmentDtos {

    private DepartmentDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DepartmentNodeResponse(
        @JsonProperty("id") String id,
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("branch_name") String branchName,
        @JsonProperty("parent_id") String parentId,
        @JsonProperty("manager_user_id") String managerUserId,
        @JsonProperty("manager_name") String managerName,
        @JsonProperty("status") String status,
        @JsonProperty("children") List<DepartmentNodeResponse> children
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DepartmentRequest(
        @NotBlank @Size(max = 32) @JsonProperty("code") String code,
        @NotBlank @Size(max = 255) @JsonProperty("name") String name,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("parent_id") String parentId,
        @JsonProperty("manager_user_id") String managerUserId,
        @JsonProperty("status") String status
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DepartmentMoveRequest(
        @JsonProperty("new_parent_id") String newParentId,
        @JsonProperty("reassign_members_to") String reassignMembersTo
    ) {
    }
}
