package com.vn9melody.openerp.modules.iam.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ResendVerificationRequest {
    @NotBlank
    @Email
    public String email;
}
