package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public record SessionsResponse(
    @JsonProperty("items") List<UserSessionResponse> items
) {

    public SessionsResponse {
        items = items != null ? items : new ArrayList<>();
    }

    public static SessionsResponse of(List<UserSessionResponse> items) {
        return new SessionsResponse(items);
    }
}
