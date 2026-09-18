package com.vn9melody.openerp.core.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.HashMap;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String code;
    private String message;
    private Map<String, Object> params;
    private T data;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, String code, String message, Map<String, Object> params, T data) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.params = params != null ? params : new HashMap<>();
        this.data = data;
    }

    public static <T> ApiResponse<T> success(String code, String message, T data) {
        return new ApiResponse<>(true, code, message, new HashMap<>(), data);
    }

    public static <T> ApiResponse<T> success(String code, String message, Map<String, Object> params, T data) {
        return new ApiResponse<>(true, code, message, params, data);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
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
        this.params = params;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
