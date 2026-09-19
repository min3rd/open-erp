package com.vn9melody.openerp.modules.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.modules.organization.model.Branch;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.vn9melody.openerp.core.enums.ResponseKey;

public final class BranchDtos {

    private BranchDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchResponse(
        @JsonProperty(ResponseKey.Json.ID) String id,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(ResponseKey.Json.PHONE) String phone,
        @JsonProperty(ResponseKey.Json.ADDRESS) String address,
        @JsonProperty(ResponseKey.Json.IS_DEFAULT) Boolean isDefault,
        @JsonProperty(ResponseKey.Json.STATUS) String status
    ) {
        public static BranchResponse from(Branch branch) {
            return new BranchResponse(
                branch.id != null ? branch.id.toString() : null,
                branch.code,
                branch.name,
                branch.phone,
                branch.address,
                branch.isDefault,
                branch.status
            );
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchRequest(
        @NotBlank @Size(max = 32) @JsonProperty(ResponseKey.Json.CODE) String code,
        @NotBlank @Size(max = 255) @JsonProperty(ResponseKey.Json.NAME) String name,
        @Size(max = 32) @JsonProperty(ResponseKey.Json.PHONE) String phone,
        @JsonProperty(ResponseKey.Json.ADDRESS) String address,
        @JsonProperty(ResponseKey.Json.STATUS) String status
    ) {
    }
}
