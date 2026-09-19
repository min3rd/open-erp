package com.vn9melody.openerp.modules.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import com.vn9melody.openerp.core.enums.ResponseKey;

public final class BranchAssignmentDtos {

    private BranchAssignmentDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAssignmentResponse(
        @JsonProperty(ResponseKey.Json.ID) String id,
        @JsonProperty(ResponseKey.Json.USER_ID) String userId,
        @JsonProperty(ResponseKey.Json.USER_EMAIL) String userEmail,
        @JsonProperty(ResponseKey.Json.BRANCH_ID) String branchId,
        @JsonProperty(ResponseKey.Json.BRANCH_CODE) String branchCode,
        @JsonProperty(ResponseKey.Json.IS_PRIMARY) Boolean isPrimary,
        @JsonProperty(ResponseKey.Json.CAN_MANAGE) Boolean canManage
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAssignmentItem(
        @NotNull @JsonProperty(ResponseKey.Json.BRANCH_ID) String branchId,
        @JsonProperty(ResponseKey.Json.IS_PRIMARY) Boolean isPrimary,
        @JsonProperty(ResponseKey.Json.CAN_MANAGE) Boolean canManage
    ) {
    }

    /**
     * Accepts either a single assignment ({@code branch_id}) as documented in DES-02-API section 4.4,
     * or a bulk list ({@code assignments[]}) to assign one user to many branches in one transaction.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAssignmentCreateRequest(
        @NotNull @JsonProperty(ResponseKey.Json.USER_ID) String userId,
        @JsonProperty(ResponseKey.Json.BRANCH_ID) String branchId,
        @JsonProperty(ResponseKey.Json.IS_PRIMARY) Boolean isPrimary,
        @JsonProperty(ResponseKey.Json.CAN_MANAGE) Boolean canManage,
        @Valid @JsonProperty(ResponseKey.Json.ASSIGNMENTS) List<BranchAssignmentItem> assignments
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAssignmentUpdateRequest(
        @JsonProperty(ResponseKey.Json.IS_PRIMARY) Boolean isPrimary,
        @JsonProperty(ResponseKey.Json.CAN_MANAGE) Boolean canManage
    ) {
    }
}
