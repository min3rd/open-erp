package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserProfileResponse(
    @JsonProperty("user_id") String userId,
    @JsonProperty("email") String email,
    @JsonProperty("full_name") String fullName,
    @JsonProperty("phone") String phone,
    @JsonProperty("avatar_url") String avatarUrl,
    @JsonProperty("language") String language,
    @JsonProperty("timezone") String timezone
) {
}
