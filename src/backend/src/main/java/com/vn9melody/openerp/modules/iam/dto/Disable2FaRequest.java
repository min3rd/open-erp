package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class Disable2FaRequest {
    @NotBlank
    @JsonProperty("current_password")
    public String currentPassword;

    @NotBlank
    public String code;
}
