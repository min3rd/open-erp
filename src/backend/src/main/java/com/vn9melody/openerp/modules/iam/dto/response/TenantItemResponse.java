package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TenantItemResponse(
    @JsonProperty("tenant_id") String id,
    @JsonProperty("tenant_name") String name,
    @JsonProperty("tenant_slug") String slug,
    @JsonProperty("role") String role,
    @JsonProperty("is_default") Boolean isDefault
) {
}
