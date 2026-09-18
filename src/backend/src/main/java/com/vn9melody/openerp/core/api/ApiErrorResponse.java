package com.vn9melody.openerp.core.api;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ApiErrorResponse {
    private boolean success = false;
    private String code;
    private String message;
    private Map<String, Object> params = new HashMap<>();
    private List<ApiFieldError> errors = new ArrayList<>();
    private Instant timestamp = Instant.now();

    public ApiErrorResponse() {
    }

    public ApiErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public ApiErrorResponse(String code, String message, Map<String, Object> params) {
        this.code = code;
        this.message = message;
        if (params != null) {
            this.params = params;
        }
    }

    public ApiErrorResponse(String code, String message, Map<String, Object> params, List<ApiFieldError> errors) {
        this.code = code;
        this.message = message;
        if (params != null) {
            this.params = params;
        }
        if (errors != null) {
            this.errors = errors;
        }
    }

    public boolean isSuccess() {
        return success;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public void setParams(Map<String, Object> params) {
        this.params = params != null ? params : new HashMap<>();
    }

    public List<ApiFieldError> getErrors() {
        return errors;
    }

    public void setErrors(List<ApiFieldError> errors) {
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
