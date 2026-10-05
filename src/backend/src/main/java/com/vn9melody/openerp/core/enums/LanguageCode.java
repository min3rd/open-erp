package com.vn9melody.openerp.core.enums;

import java.util.Arrays;
import java.util.Optional;

/**
 * Supported UI locales (Sprint 04, FEAT-29). Mirrors the frontend {@code LangCode}
 * registry one-to-one; the account profile stores one of these codes.
 */
public enum LanguageCode {
    VI("vi"),
    EN("en"),
    ZH_CN("zh-CN"),
    JA("ja"),
    KO("ko"),
    ES("es"),
    FR("fr"),
    DE("de"),
    PT_BR("pt-BR"),
    RU("ru"),
    AR("ar"),
    TH("th"),
    ID("id");

    private final String code;

    LanguageCode(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    /** Case-insensitive lookup returning the canonical code casing. */
    public static Optional<LanguageCode> fromCode(String value) {
        if (value == null) {
            return Optional.empty();
        }
        String normalized = value.trim();
        return Arrays.stream(values())
                .filter(language -> language.code.equalsIgnoreCase(normalized))
                .findFirst();
    }
}
