package com.vn9melody.openerp.plugins.form.dto;

import java.util.Map;

public record SaveFormRequest(
        String slug,
        String title,
        String description,
        Map<String, Object> document,
        Map<String, Object> entityMapping) {
}
