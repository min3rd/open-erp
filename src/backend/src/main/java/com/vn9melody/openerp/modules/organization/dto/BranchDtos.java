package com.vn9melody.openerp.modules.organization.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.modules.organization.model.Branch;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class BranchDtos {

    private BranchDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BranchResponse(
        @JsonProperty("id") String id,
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("phone") String phone,
        @JsonProperty("address") String address,
        @JsonProperty("is_default") Boolean isDefault,
        @JsonProperty("status") String status
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
        @NotBlank @Size(max = 32) @JsonProperty("code") String code,
        @NotBlank @Size(max = 255) @JsonProperty("name") String name,
        @Size(max = 32) @JsonProperty("phone") String phone,
        @JsonProperty("address") String address,
        @JsonProperty("status") String status
    ) {
    }
}
