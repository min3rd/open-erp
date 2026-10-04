package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TwoFactorStatusResponse(
    @JsonProperty("is_enabled") Boolean isEnabled,
    @JsonProperty("enabled_at") String enabledAt,
    @JsonProperty("backup_codes_remaining") Integer backupCodesRemaining
) {
}
