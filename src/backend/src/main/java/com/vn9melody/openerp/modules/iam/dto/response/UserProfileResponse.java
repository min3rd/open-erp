package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UserProfileResponse {
    @JsonProperty("user_id")
    public String userId;

    @JsonProperty("email")
    public String email;

    @JsonProperty("full_name")
    public String fullName;

    @JsonProperty("phone")
    public String phone;

    @JsonProperty("avatar_url")
    public String avatarUrl;

    @JsonProperty("language")
    public String language;

    @JsonProperty("timezone")
    public String timezone;

    public UserProfileResponse() {}

    public UserProfileResponse(String userId, String email, String fullName, String phone, String avatarUrl, String language, String timezone) {
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.language = language;
        this.timezone = timezone;
    }
}
