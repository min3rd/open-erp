package com.vn9melody.openerp.modules.catalog.api;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiFieldError;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.ResponseKey;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Shared input normalisation/validation helpers of the Catalog plugin. Failures
 * are raised as standard {@link ApiException} envelopes with a field error so the
 * frontend can translate {@code code} + {@code params} (never Vietnamese text).
 */
public final class CatalogSupport {

    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    public static final int DEFAULT_MAX_DEPTH = 20;
    public static final int MAX_CODE_LENGTH = 64;

    private CatalogSupport() {
    }

    /** Uppercased, trimmed code; null when the input is blank. */
    public static String normalizeCode(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    public static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw validation(field, ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        return value.trim();
    }

    public static Instant parseInstant(String value, String field, Instant fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Instant.parse(value.trim());
        } catch (DateTimeParseException e) {
            throw validation(field, ErrorCode.VALIDATION_INVALID,
                Map.of(ResponseKey.FIELD.getKey(), field));
        }
    }

    /** Parses an optional UUID query/body value; blank means null. */
    public static UUID parseUuid(String value, String field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            throw validation(field, ErrorCode.VALIDATION_INVALID,
                Map.of(ResponseKey.FIELD.getKey(), field));
        }
    }

    public static int page(int page) {
        return Math.max(page, 0);
    }

    public static int size(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    public static ApiException validation(String field, String code, Map<String, Object> params) {
        return new ApiException(400, ErrorCode.VALIDATION_FAILED,
            "Catalog request validation failed",
            Map.of(ResponseKey.FIELD.getKey(), field),
            List.of(new ApiFieldError(field, code, params)));
    }

    /** Strict enum parsing for request bodies (unknown value = 400, not a silent fallback). */
    public static <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field, E fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw validation(field, ErrorCode.VALIDATION_INVALID,
                Map.of(ResponseKey.FIELD.getKey(), field));
        }
    }

    public static ApiException notFound(String code, String field, Object value) {
        return new ApiException(404, code, "Catalog resource not found",
            Map.of(field, value == null ? "" : value.toString()));
    }

    public static ApiException conflict(String code, Map<String, Object> params) {
        return new ApiException(409, code, "Catalog resource conflict", params);
    }
}
