package com.vn9melody.openerp.core.enums;

/**
 * Shared case-insensitive enum lookup used by every {@code fromString} helper.
 * Returns the supplied fallback for {@code null}, blank or unknown input.
 */
public final class EnumParser {

    private EnumParser() {
    }

    public static <E extends Enum<E>> E parse(Class<E> type, String value, E fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String normalized = value.trim();
        for (E candidate : type.getEnumConstants()) {
            if (candidate.name().equalsIgnoreCase(normalized)) {
                return candidate;
            }
        }
        return fallback;
    }
}
