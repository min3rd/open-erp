package com.vn9melody.openerp.core.api;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ApiException extends RuntimeException {
    private final int statusCode;
    private final String code;
    private final Map<String, Object> params;
    private final List<ApiFieldError> errors;

    public ApiException(int statusCode, String code, String message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.params = new HashMap<>();
        this.errors = new ArrayList<>();
    }

    public ApiException(int statusCode, String code, String message, Map<String, Object> params) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.params = params != null ? params : new HashMap<>();
        this.errors = new ArrayList<>();
    }

    public ApiException(int statusCode, String code, String message, List<ApiFieldError> errors) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.params = new HashMap<>();
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public ApiException(int statusCode, String code, String message, Map<String, Object> params, List<ApiFieldError> errors) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.params = params != null ? params : new HashMap<>();
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public int getStatusCode() {
        return statusCode;
    }

    public int getHttpStatus() {
        return statusCode;
    }

    public String getCode() {
        return code;
    }

    public String getErrorCode() {
        return code;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public List<ApiFieldError> getErrors() {
        return errors;
    }
}
