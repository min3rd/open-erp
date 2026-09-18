package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RefreshTokenResponse {
    @JsonProperty("access_token")
    public String accessToken;

    @JsonProperty("expires_in")
    public Integer expiresIn;

    public RefreshTokenResponse() {}

    public RefreshTokenResponse(String accessToken, Integer expiresIn) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
    }
}
