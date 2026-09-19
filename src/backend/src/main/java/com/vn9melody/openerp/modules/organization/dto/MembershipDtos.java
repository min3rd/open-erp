package com.vn9melody.openerp.modules.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public final class MembershipDtos {

    private MembershipDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MembershipResponse(
        @JsonProperty("id") String id,
        @JsonProperty("user_id") String userId,
        @JsonProperty("user_email") String userEmail,
        @JsonProperty("user_full_name") String userFullName,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("branch_name") String branchName,
        @JsonProperty("department_id") String departmentId,
        @JsonProperty("department_name") String departmentName,
        @JsonProperty("direct_manager_user_id") String directManagerUserId,
        @JsonProperty("direct_manager_name") String directManagerName,
        @JsonProperty("title") String title,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("joined_at") String joinedAt
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MembershipRequest(
        @NotNull @JsonProperty("user_id") String userId,
        @NotNull @JsonProperty("branch_id") String branchId,
        @NotNull @JsonProperty("department_id") String departmentId,
        @JsonProperty("direct_manager_user_id") String directManagerUserId,
        @JsonProperty("title") String title,
        @JsonProperty("is_primary") Boolean isPrimary
    ) {
    }
}
