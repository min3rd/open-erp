package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.enums.AccountStatus;

public record VerifyEmailResponse(
    @JsonProperty("status") AccountStatus status,
    @JsonProperty("personal_tenant_id") String personalTenantId
) {
}
