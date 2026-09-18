package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ProfileUpdateRequest {
    @NotBlank
    @Size(min = 2, max = 128)
    @JsonProperty("full_name")
    public String fullName;

    public String phone;

    @JsonProperty("avatar_url")
    public String avatarUrl;

    public String language;

    public String timezone;
}
