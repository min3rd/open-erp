package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserSessionResponse(
    @JsonProperty("session_id") String sessionId,
    @JsonProperty("device") String device,
    @JsonProperty("ip_address") String ipAddress,
    @JsonProperty("last_active_at") String lastActiveAt,
    @JsonProperty("created_at") String createdAt,
    @JsonProperty("is_current") Boolean isCurrent
) {
}
