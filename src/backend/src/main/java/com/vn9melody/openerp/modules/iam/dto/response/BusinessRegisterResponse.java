package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.enums.UserRole;

public record BusinessRegisterResponse(
    @JsonProperty("tenant_id") String tenantId,
    @JsonProperty("tenant_slug") String tenantSlug,
    @JsonProperty("user_id") String userId,
    @JsonProperty("role") UserRole role
) {
}
