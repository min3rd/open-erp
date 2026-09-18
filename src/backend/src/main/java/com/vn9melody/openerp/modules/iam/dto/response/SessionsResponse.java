package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class SessionsResponse {

    @JsonProperty("items")
    private List<UserSessionResponse> items = new ArrayList<>();

    public SessionsResponse() {
    }

    public SessionsResponse(List<UserSessionResponse> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public static SessionsResponse of(List<UserSessionResponse> items) {
        return new SessionsResponse(items);
    }

    public List<UserSessionResponse> getItems() {
        return items;
    }

    public void setItems(List<UserSessionResponse> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
