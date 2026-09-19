package com.vn9melody.openerp.modules.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import com.vn9melody.openerp.core.enums.ResponseKey;

public final class DepartmentDtos {

    private DepartmentDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DepartmentNodeResponse(
        @JsonProperty(ResponseKey.Json.ID) String id,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(ResponseKey.Json.BRANCH_ID) String branchId,
        @JsonProperty(ResponseKey.Json.BRANCH_NAME) String branchName,
        @JsonProperty(ResponseKey.Json.PARENT_ID) String parentId,
        @JsonProperty(ResponseKey.Json.MANAGER_USER_ID) String managerUserId,
        @JsonProperty(ResponseKey.Json.MANAGER_NAME) String managerName,
        @JsonProperty(ResponseKey.Json.STATUS) String status,
        @JsonProperty(ResponseKey.Json.CHILDREN) List<DepartmentNodeResponse> children
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DepartmentRequest(
        @NotBlank @Size(max = 32) @JsonProperty(ResponseKey.Json.CODE) String code,
        @NotBlank @Size(max = 255) @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(ResponseKey.Json.BRANCH_ID) String branchId,
        @JsonProperty(ResponseKey.Json.PARENT_ID) String parentId,
        @JsonProperty(ResponseKey.Json.MANAGER_USER_ID) String managerUserId,
        @JsonProperty(ResponseKey.Json.STATUS) String status
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DepartmentMoveRequest(
        @JsonProperty(ResponseKey.Json.NEW_PARENT_ID) String newParentId,
        @JsonProperty(ResponseKey.Json.REASSIGN_MEMBERS_TO) String reassignMembersTo
    ) {
    }
}
