package com.vn9melody.openerp.plugins.form.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public record SubmitResponseRequest(
        Map<String, Object> answers,
        @JsonProperty("responder_email") String responderEmail,
        @JsonProperty("idempotency_key") String idempotencyKey,
        @JsonProperty("captcha_token") String captchaToken) {
}
