package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TenantItemResponse {
    @JsonProperty("tenant_id")
    public String id;

    @JsonProperty("tenant_name")
    public String name;

    @JsonProperty("tenant_slug")
    public String slug;

    @JsonProperty("role")
    public String role;

    @JsonProperty("is_default")
    public Boolean isDefault;

    public TenantItemResponse() {}

    public TenantItemResponse(String id, String name, String slug, String role, Boolean isDefault) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.role = role;
        this.isDefault = isDefault;
    }
}
