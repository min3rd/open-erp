package com.vn9melody.openerp.core.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CompanySize {
    MICRO("1-10"),
    SMALL("11-50"),
    MEDIUM("51-200"),
    ENTERPRISE("201+");

    private final String code;

    CompanySize(String code) {
        this.code = code;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static CompanySize fromCode(String value) {
        if (value == null) return SMALL;
        for (CompanySize cs : values()) {
            if (cs.code.equalsIgnoreCase(value) || cs.name().equalsIgnoreCase(value)) {
                return cs;
            }
        }
        return SMALL;
    }
}
