package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TwoFactorEnableResponse {
    @JsonProperty("is_enabled")
    public Boolean isEnabled;

    @JsonProperty("enabled_at")
    public String enabledAt;

    public TwoFactorEnableResponse() {}

    public TwoFactorEnableResponse(Boolean isEnabled, String enabledAt) {
        this.isEnabled = isEnabled;
        this.enabledAt = enabledAt;
    }
}
