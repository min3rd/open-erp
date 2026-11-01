package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.UUID;

/** Tolerant readers for plugin data gateway row values. */
public final class Rows {

    private Rows() {
    }

    public static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    public static UUID uuid(Object value) {
        if (value == null) {
            return null;
        }
        return UUID.fromString(String.valueOf(value));
    }

    public static Boolean bool(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.valueOf(String.valueOf(value));
    }

    public static LocalDate date(Object value) {
        return value == null ? null : LocalDate.parse(String.valueOf(value));
    }

    public static Instant instant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return Instant.ofEpochMilli(number.longValue());
        }
        String text = String.valueOf(value);
        try {
            return Instant.parse(text);
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(text).toInstant();
            } catch (DateTimeParseException ignoredAgain) {
                return null;
            }
        }
    }

    public static Integer integer(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(String.valueOf(value));
    }

    public static Long longValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.valueOf(String.valueOf(value));
    }

    public static Map<String, Object> row(Map<String, Object> row) {
        return row == null ? Map.of() : row;
    }
}
