package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class SelectTenantRequest {
    @NotNull
    @JsonProperty("pre_auth_token")
    public String preAuthToken;

    @NotNull
    @JsonProperty("tenant_id")
    public UUID tenantId;
}
