package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record TwoFactorEnableResponse(
    @JsonProperty("is_enabled") Boolean isEnabled,
    @JsonProperty("enabled_at") String enabledAt,
    @JsonProperty("backup_codes") List<String> backupCodes
) {
}
