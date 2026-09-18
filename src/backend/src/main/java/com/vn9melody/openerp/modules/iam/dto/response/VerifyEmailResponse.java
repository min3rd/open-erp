package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.enums.AccountStatus;

public class VerifyEmailResponse {
    @JsonProperty("status")
    public AccountStatus status;

    @JsonProperty("personal_tenant_id")
    public String personalTenantId;

    public VerifyEmailResponse() {}

    public VerifyEmailResponse(AccountStatus status, String personalTenantId) {
        this.status = status;
        this.personalTenantId = personalTenantId;
    }
}
