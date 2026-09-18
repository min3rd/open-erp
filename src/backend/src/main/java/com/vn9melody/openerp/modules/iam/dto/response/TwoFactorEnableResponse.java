package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class TwoFactorEnableResponse {
    @JsonProperty("is_enabled")
    public Boolean isEnabled;

    @JsonProperty("enabled_at")
    public String enabledAt;

    @JsonProperty("backup_codes")
    public List<String> backupCodes;

    public TwoFactorEnableResponse() {}

    public TwoFactorEnableResponse(Boolean isEnabled, String enabledAt, List<String> backupCodes) {
        this.isEnabled = isEnabled;
        this.enabledAt = enabledAt;
        this.backupCodes = backupCodes;
    }
}
