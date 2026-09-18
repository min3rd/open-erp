package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TwoFactorSetupResponse {
    @JsonProperty("secret_key")
    public String secretKey;

    @JsonProperty("qr_code_uri")
    public String qrCodeUri;

    public TwoFactorSetupResponse() {}

    public TwoFactorSetupResponse(String secretKey, String qrCodeUri) {
        this.secretKey = secretKey;
        this.qrCodeUri = qrCodeUri;
    }
}
