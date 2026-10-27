package com.vn9melody.openerp.plugin.sdk.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Standard error envelope (4 response templates, api_standards.md). */
public class ApiErrorResponse {

    private final boolean success = false;
    private final String code;
    private final String message;
    private final Map<String, Object> params;
    private final List<ApiFieldError> errors;
    private final Instant timestamp;

    public ApiErrorResponse(String code, String message, Map<String, Object> params, List<ApiFieldError> errors) {
        this.code = code;
        this.message = message;
        this.params = params == null ? Map.of() : params;
        this.errors = errors == null ? List.of() : errors;
        this.timestamp = Instant.now();
    }

    public static ApiErrorResponse from(ApiException error) {
        return new ApiErrorResponse(error.getCode(), error.getMessage(), error.getParams(), error.getErrors());
    }

    public boolean isSuccess() {
        return success;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public List<ApiFieldError> getErrors() {
        return errors;
    }

    public Instant getTimestamp() {
        return timestamp;
    }
}
