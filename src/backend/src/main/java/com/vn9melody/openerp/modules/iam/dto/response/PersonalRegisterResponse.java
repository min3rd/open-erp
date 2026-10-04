package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.enums.AccountStatus;

public record PersonalRegisterResponse(
    @JsonProperty("user_id") String userId,
    @JsonProperty("email") String email,
    @JsonProperty("status") AccountStatus status
) {
}
