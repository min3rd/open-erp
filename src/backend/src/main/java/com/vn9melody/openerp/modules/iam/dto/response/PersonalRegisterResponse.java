package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.enums.AccountStatus;

public class PersonalRegisterResponse {
    @JsonProperty("user_id")
    public String userId;

    @JsonProperty("email")
    public String email;

    @JsonProperty("status")
    public AccountStatus status;

    public PersonalRegisterResponse() {}

    public PersonalRegisterResponse(String userId, String email, AccountStatus status) {
        this.userId = userId;
        this.email = email;
        this.status = status;
    }
}
