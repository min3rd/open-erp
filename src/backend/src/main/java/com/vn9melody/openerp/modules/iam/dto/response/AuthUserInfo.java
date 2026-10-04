package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AuthUserInfo(
    @JsonProperty("user_id") String id,
    @JsonProperty("email") String email,
    @JsonProperty("full_name") String fullName,
    @JsonProperty("tenant_id") String tenantId,
    @JsonProperty("tenant_name") String tenantName,
    @JsonProperty("tenant_slug") String tenantSlug,
    @JsonProperty("role") String role
) {
}
