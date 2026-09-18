package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class VerifyEmailRequest {
    @NotBlank
    @Email
    public String email;

    @NotBlank
    @JsonProperty("otp_code")
    public String otpCode;
}
