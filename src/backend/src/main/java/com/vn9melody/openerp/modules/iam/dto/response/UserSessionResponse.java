package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UserSessionResponse {
    @JsonProperty("session_id")
    public String sessionId;

    @JsonProperty("device")
    public String device;

    @JsonProperty("ip_address")
    public String ipAddress;

    @JsonProperty("last_active_at")
    public String lastActiveAt;

    @JsonProperty("created_at")
    public String createdAt;

    @JsonProperty("is_current")
    public Boolean isCurrent;

    public UserSessionResponse() {}

    public UserSessionResponse(String sessionId, String device, String ipAddress, String lastActiveAt, String createdAt, Boolean isCurrent) {
        this.sessionId = sessionId;
        this.device = device;
        this.ipAddress = ipAddress;
        this.lastActiveAt = lastActiveAt;
        this.createdAt = createdAt;
        this.isCurrent = isCurrent;
    }
}
