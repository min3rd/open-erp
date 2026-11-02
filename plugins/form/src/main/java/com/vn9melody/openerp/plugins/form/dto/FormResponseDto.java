package com.vn9melody.openerp.plugins.form.dto;

import com.vn9melody.openerp.plugins.form.model.FormResponse;
import java.util.Map;
import java.util.UUID;

public record FormResponseDto(
        UUID id,
        UUID formId,
        Integer formVersion,
        Map<String, Object> answers,
        String responderEmail,
        UUID submittedByUserId,
        String entityWriteStatus,
        String entityWriteError,
        String submittedAt) {

    public static FormResponseDto from(FormResponse response) {
        return new FormResponseDto(
                response.id(),
                response.formId(),
                response.formVersion(),
                response.answers(),
                response.responderEmail(),
                response.submittedByUserId(),
                response.entityWriteStatus(),
                response.entityWriteError(),
                response.submittedAt() == null ? null : response.submittedAt().toString());
    }
}
