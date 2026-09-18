package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TwoFactorStatusResponse {
    @JsonProperty("is_enabled")
    public Boolean isEnabled;

    @JsonProperty("enabled_at")
    public String enabledAt;

    @JsonProperty("backup_codes_remaining")
    public Integer backupCodesRemaining;

    public TwoFactorStatusResponse() {}

    public TwoFactorStatusResponse(Boolean isEnabled, String enabledAt, Integer backupCodesRemaining) {
        this.isEnabled = isEnabled;
        this.enabledAt = enabledAt;
        this.backupCodesRemaining = backupCodesRemaining;
    }
}
