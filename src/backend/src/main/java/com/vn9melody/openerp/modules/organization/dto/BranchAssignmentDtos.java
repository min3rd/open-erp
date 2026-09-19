package com.vn9melody.openerp.modules.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class BranchAssignmentDtos {

    private BranchAssignmentDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAssignmentResponse(
        @JsonProperty("id") String id,
        @JsonProperty("user_id") String userId,
        @JsonProperty("user_email") String userEmail,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("branch_code") String branchCode,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("can_manage") Boolean canManage
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAssignmentItem(
        @NotNull @JsonProperty("branch_id") String branchId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("can_manage") Boolean canManage
    ) {
    }

    /**
     * Accepts either a single assignment ({@code branch_id}) as documented in DES-02-API section 4.4,
     * or a bulk list ({@code assignments[]}) to assign one user to many branches in one transaction.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAssignmentCreateRequest(
        @NotNull @JsonProperty("user_id") String userId,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("can_manage") Boolean canManage,
        @Valid @JsonProperty("assignments") List<BranchAssignmentItem> assignments
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchAssignmentUpdateRequest(
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("can_manage") Boolean canManage
    ) {
    }
}
