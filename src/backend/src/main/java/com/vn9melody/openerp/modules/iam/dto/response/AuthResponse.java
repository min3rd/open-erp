package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
    @JsonProperty("access_token") String accessToken,
    @JsonProperty("refresh_token") String refreshToken,
    @JsonProperty("session_id") String sessionId,
    @JsonProperty("expires_in") Integer expiresIn,
    @JsonProperty("user") AuthUserInfo user,
    @JsonProperty("pre_auth_token") String preAuthToken,
    @JsonProperty("requires_2fa") Boolean requires2Fa,
    @JsonProperty("requires_tenant_selection") Boolean requiresTenantSelection,
    @JsonProperty("tenants") List<TenantItemResponse> tenants
) {

    public static AuthResponse forSuccess(String accessToken, String refreshToken, String sessionId, Integer expiresIn, AuthUserInfo user) {
        return new AuthResponse(accessToken, refreshToken, sessionId, expiresIn, user, null, null, null, null);
    }

    public static AuthResponse for2FaChallenge(String preAuthToken) {
        return new AuthResponse(null, null, null, null, null, preAuthToken, true, null, null);
    }

    public static AuthResponse forTenantSelection(String preAuthToken, List<TenantItemResponse> tenants) {
        return new AuthResponse(null, null, null, null, null, preAuthToken, null, true, tenants);
    }
}
