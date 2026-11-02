package com.vn9melody.openerp.plugins.form.dto;

import java.util.Map;

public record SubmitResponseRequest(
        Map<String, Object> answers,
        String responderEmail,
        String idempotencyKey,
        String captchaToken) {
}
