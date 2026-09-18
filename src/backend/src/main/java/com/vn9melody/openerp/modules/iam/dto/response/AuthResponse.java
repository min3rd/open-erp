package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    @JsonProperty("access_token")
    public String accessToken;

    @JsonProperty("refresh_token")
    public String refreshToken;

    @JsonProperty("session_id")
    public String sessionId;

    @JsonProperty("expires_in")
    public Integer expiresIn;

    @JsonProperty("user")
    public AuthUserInfo user;

    @JsonProperty("pre_auth_token")
    public String preAuthToken;

    @JsonProperty("requires_2fa")
    public Boolean requires2Fa;

    @JsonProperty("requires_tenant_selection")
    public Boolean requiresTenantSelection;

    @JsonProperty("tenants")
    public List<TenantItemResponse> tenants;

    public AuthResponse() {}

    public static AuthResponse forSuccess(String accessToken, String refreshToken, String sessionId, Integer expiresIn, AuthUserInfo user) {
        AuthResponse resp = new AuthResponse();
        resp.accessToken = accessToken;
        resp.refreshToken = refreshToken;
        resp.sessionId = sessionId;
        resp.expiresIn = expiresIn;
        resp.user = user;
        return resp;
    }

    public static AuthResponse for2FaChallenge(String preAuthToken) {
        AuthResponse resp = new AuthResponse();
        resp.preAuthToken = preAuthToken;
        resp.requires2Fa = true;
        return resp;
    }

    public static AuthResponse forTenantSelection(String preAuthToken, List<TenantItemResponse> tenants) {
        AuthResponse resp = new AuthResponse();
        resp.preAuthToken = preAuthToken;
        resp.requiresTenantSelection = true;
        resp.tenants = tenants;
        return resp;
    }
}
