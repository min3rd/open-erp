package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class RefreshTokenRequest {
    @NotBlank
    @JsonProperty("refresh_token")
    public String refreshToken;
}
