package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TwoFactorSetupResponse(
    @JsonProperty("secret_key") String secretKey,
    @JsonProperty("qr_code_uri") String qrCodeUri
) {
}
