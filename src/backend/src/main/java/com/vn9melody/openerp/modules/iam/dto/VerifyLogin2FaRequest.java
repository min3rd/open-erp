package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class VerifyLogin2FaRequest {
    @NotBlank
    @JsonProperty("pre_auth_token")
    public String preAuthToken;

    @NotBlank
    public String code;
}
