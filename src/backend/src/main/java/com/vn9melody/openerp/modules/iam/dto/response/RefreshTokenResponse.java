package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RefreshTokenResponse(
    @JsonProperty("access_token") String accessToken,
    @JsonProperty("expires_in") Integer expiresIn
) {
}
