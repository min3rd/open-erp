package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthUserInfo {
    @JsonProperty("user_id")
    public String id;

    @JsonProperty("email")
    public String email;

    @JsonProperty("full_name")
    public String fullName;

    @JsonProperty("tenant_id")
    public String tenantId;

    @JsonProperty("tenant_name")
    public String tenantName;

    @JsonProperty("tenant_slug")
    public String tenantSlug;

    @JsonProperty("role")
    public String role;

    public AuthUserInfo() {}

    public AuthUserInfo(String id, String email, String fullName, String tenantId, String tenantName, String tenantSlug, String role) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.tenantId = tenantId;
        this.tenantName = tenantName;
        this.tenantSlug = tenantSlug;
        this.role = role;
    }
}
