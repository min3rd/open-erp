package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {
    @NotBlank
    public String token;

    @NotBlank
    @Size(min = 8, max = 64)
    @JsonProperty("new_password")
    public String newPassword;
}
