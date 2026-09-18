package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.enums.UserRole;

public class BusinessRegisterResponse {
    @JsonProperty("tenant_id")
    public String tenantId;

    @JsonProperty("tenant_slug")
    public String tenantSlug;

    @JsonProperty("user_id")
    public String userId;

    @JsonProperty("role")
    public UserRole role;

    public BusinessRegisterResponse() {}

    public BusinessRegisterResponse(String tenantId, String tenantSlug, String userId, UserRole role) {
        this.tenantId = tenantId;
        this.tenantSlug = tenantSlug;
        this.userId = userId;
        this.role = role;
    }
}
