package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PersonalRegisterRequest {
    @NotBlank
    @Size(min = 2, max = 128)
    @JsonProperty("full_name")
    public String fullName;

    @NotBlank
    @Email
    public String email;

    @NotBlank
    @Size(min = 8, max = 64)
    public String password;

    public String phone;
}
