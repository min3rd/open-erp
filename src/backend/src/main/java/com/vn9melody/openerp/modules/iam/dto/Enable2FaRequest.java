package com.vn9melody.openerp.modules.iam.dto;

import jakarta.validation.constraints.NotBlank;

public class Enable2FaRequest {
    @NotBlank
    public String code;
}
