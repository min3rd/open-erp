package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.enums.CompanySize;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BusinessRegisterRequest {
    @NotNull
    @Valid
    public AdminInfo admin;

    @NotNull
    @Valid
    public TenantInfo tenant;

    public static class AdminInfo {
        @NotBlank
        @JsonProperty("full_name")
        public String fullName;

        @NotBlank
        @Email
        public String email;

        @NotBlank
        @Size(min = 8, max = 64)
        public String password;
    }

    public static class TenantInfo {
        @NotBlank
        public String name;

        @NotBlank
        @Size(min = 3, max = 64)
        public String slug;

        @JsonProperty("tax_code")
        public String taxCode;

        @JsonProperty("company_size")
        public CompanySize companySize;

        public String currency = "VND";
    }
}
