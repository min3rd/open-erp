package com.vn9melody.openerp.modules.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import com.vn9melody.openerp.core.enums.ResponseKey;

public final class MembershipDtos {

    private MembershipDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MembershipResponse(
        @JsonProperty(ResponseKey.Json.ID) String id,
        @JsonProperty(ResponseKey.Json.USER_ID) String userId,
        @JsonProperty(ResponseKey.Json.USER_EMAIL) String userEmail,
        @JsonProperty(ResponseKey.Json.USER_FULL_NAME) String userFullName,
        @JsonProperty(ResponseKey.Json.BRANCH_ID) String branchId,
        @JsonProperty(ResponseKey.Json.BRANCH_NAME) String branchName,
        @JsonProperty(ResponseKey.Json.DEPARTMENT_ID) String departmentId,
        @JsonProperty(ResponseKey.Json.DEPARTMENT_NAME) String departmentName,
        @JsonProperty(ResponseKey.Json.DIRECT_MANAGER_USER_ID) String directManagerUserId,
        @JsonProperty(ResponseKey.Json.DIRECT_MANAGER_NAME) String directManagerName,
        @JsonProperty(ResponseKey.Json.TITLE) String title,
        @JsonProperty(ResponseKey.Json.IS_PRIMARY) Boolean isPrimary,
        @JsonProperty(ResponseKey.Json.JOINED_AT) String joinedAt
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MembershipRequest(
        @NotNull @JsonProperty(ResponseKey.Json.USER_ID) String userId,
        @NotNull @JsonProperty(ResponseKey.Json.BRANCH_ID) String branchId,
        @NotNull @JsonProperty(ResponseKey.Json.DEPARTMENT_ID) String departmentId,
        @JsonProperty(ResponseKey.Json.DIRECT_MANAGER_USER_ID) String directManagerUserId,
        @JsonProperty(ResponseKey.Json.TITLE) String title,
        @JsonProperty(ResponseKey.Json.IS_PRIMARY) Boolean isPrimary
    ) {
    }
}
