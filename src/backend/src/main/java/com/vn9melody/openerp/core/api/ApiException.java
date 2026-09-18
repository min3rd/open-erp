package com.vn9melody.openerp.core.api;

import java.util.HashMap;
import java.util.Map;

public class ApiException extends RuntimeException {
    private final int statusCode;
    private final String code;
    private final Map<String, Object> params;

    public ApiException(int statusCode, String code, String message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.params = new HashMap<>();
    }

    public ApiException(int statusCode, String code, String message, Map<String, Object> params) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.params = params != null ? params : new HashMap<>();
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
}
