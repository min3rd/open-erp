package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class TwoFactorSetupResponse {
    @JsonProperty("secret_key")
    public String secretKey;

    @JsonProperty("qr_code_uri")
    public String qrCodeUri;

    @JsonProperty("backup_codes")
    public List<String> backupCodes;

    public TwoFactorSetupResponse() {}

    public TwoFactorSetupResponse(String secretKey, String qrCodeUri, List<String> backupCodes) {
        this.secretKey = secretKey;
        this.qrCodeUri = qrCodeUri;
        this.backupCodes = backupCodes;
    }
}
