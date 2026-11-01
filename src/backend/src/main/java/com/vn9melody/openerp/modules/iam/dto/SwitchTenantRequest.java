package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/** Switch the active tenant using the current access token. */
public class SwitchTenantRequest {

    @NotNull
    @JsonProperty("tenant_id")
    public UUID tenantId;
}
