package com.vn9melody.openerp.core.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashMap;
import java.util.Map;

public class ApiFieldError {

    @JsonProperty("field")
    private String field;

    @JsonProperty("code")
    private String code;

    @JsonProperty("params")
    private Map<String, Object> params = new HashMap<>();

    public ApiFieldError() {
    }

    public ApiFieldError(String field, String code, Map<String, Object> params) {
        this.field = field;
        this.code = code;
        this.params = params != null ? params : new HashMap<>();
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public void setParams(Map<String, Object> params) {
        this.params = params != null ? params : new HashMap<>();
    }
}
