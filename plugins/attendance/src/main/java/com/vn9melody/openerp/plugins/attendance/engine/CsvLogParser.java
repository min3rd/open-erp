package com.vn9melody.openerp.plugins.attendance.engine;

import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.ImportRowError;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Robust CSV parser for BioTime/ZKTeco and standard attendance log exports (ADR-S09-005 §2.1).
 */
public final class CsvLogParser {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final List<DateTimeFormatter> DATE_TIME_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ISO_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    );

    private static final List<DateTimeFormatter> DATE_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy")
    );

    private static final List<DateTimeFormatter> TIME_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ISO_LOCAL_TIME,
            DateTimeFormatter.ofPattern("HH:mm:ss"),
            DateTimeFormatter.ofPattern("HH:mm")
    );

    public record ParsedLogEntry(
            int rowIndex,
            String employeeCode,
            Instant occurredAt,
            LogEventType eventType,
            String deviceCode
    ) {}

    public record ParseResult(
            List<ParsedLogEntry> entries,
            List<ImportRowError> errors
    ) {}

    private CsvLogParser() {}

    public static ParseResult parse(String csvContent, ZoneId zoneId) {
        ZoneId zone = zoneId != null ? zoneId : DEFAULT_ZONE;
        List<ParsedLogEntry> entries = new ArrayList<>();
        List<ImportRowError> errors = new ArrayList<>();

        if (csvContent == null || csvContent.isBlank()) {
            return new ParseResult(entries, errors);
        }

        String[] lines = csvContent.split("\\r?\\n");
        if (lines.length == 0) {
            return new ParseResult(entries, errors);
        }

        int headerIndex = -1;
        String[] headers = null;
        char delimiter = ',';

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            delimiter = detectDelimiter(line);
            headers = splitLine(line, delimiter);
            headerIndex = i;
            break;
        }

        if (headers == null) {
            return new ParseResult(entries, errors);
        }

        int codeCol = -1;
        int dateTimeCol = -1;
        int dateCol = -1;
        int timeCol = -1;
        int eventCol = -1;
        int deviceCol = -1;

        for (int c = 0; c < headers.length; c++) {
            String h = headers[c].trim().toLowerCase(Locale.ROOT).replace("\"", "").replace("_", "");
            if (h.contains("employeecode") || h.contains("enrollnumber") || h.contains("manv") || h.contains("badge") || h.equals("code") || h.equals("id")) {
                codeCol = c;
            } else if (h.contains("datetime") || h.contains("occurredat") || h.contains("thoigian") || h.equals("timestamp")) {
                dateTimeCol = c;
            } else if (h.contains("date") || h.contains("ngay")) {
                dateCol = c;
            } else if (h.contains("time") || h.contains("gio")) {
                timeCol = c;
            } else if (h.contains("punch") || h.contains("event") || h.contains("state") || h.contains("trangthai") || h.contains("type")) {
                eventCol = c;
            } else if (h.contains("device") || h.contains("thietbi") || h.contains("machine")) {
                deviceCol = c;
            }
        }

        // If no named header matched, fallback to positional if columns >= 3
        if (codeCol == -1 && headers.length >= 3) {
            codeCol = 0;
            dateTimeCol = 1;
            eventCol = 2;
            if (headers.length >= 4) deviceCol = 3;
        }

        for (int i = headerIndex + 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            int rowNumber = i + 1;
            String[] cols = splitLine(line, delimiter);

            if (codeCol >= cols.length || codeCol < 0) {
                errors.add(new ImportRowError(rowNumber, "", "Missing employee code column"));
                continue;
            }
            String code = cols[codeCol].trim().replace("\"", "");
            if (code.isEmpty()) {
                errors.add(new ImportRowError(rowNumber, "", "Employee code is empty"));
                continue;
            }

            Instant occurredAt = null;
            if (dateTimeCol >= 0 && dateTimeCol < cols.length) {
                String dtStr = cols[dateTimeCol].trim().replace("\"", "");
                occurredAt = parseDateTime(dtStr, zone);
            } else if (dateCol >= 0 && timeCol >= 0 && dateCol < cols.length && timeCol < cols.length) {
                String dStr = cols[dateCol].trim().replace("\"", "");
                String tStr = cols[timeCol].trim().replace("\"", "");
                occurredAt = parseDateAndTime(dStr, tStr, zone);
            }

            if (occurredAt == null) {
                errors.add(new ImportRowError(rowNumber, code, "Invalid date/time format"));
                continue;
            }

            LogEventType eventType = LogEventType.IN;
            if (eventCol >= 0 && eventCol < cols.length) {
                String evStr = cols[eventCol].trim().replace("\"", "");
                eventType = parseEventType(evStr);
            }

            String device = "";
            if (deviceCol >= 0 && deviceCol < cols.length) {
                device = cols[deviceCol].trim().replace("\"", "");
            }

            entries.add(new ParsedLogEntry(rowNumber, code, occurredAt, eventType, device.isEmpty() ? null : device));
        }

        return new ParseResult(entries, errors);
    }

    private static char detectDelimiter(String line) {
        if (line.contains(";")) return ';';
        if (line.contains("\t")) return '\t';
        return ',';
    }

    private static String[] splitLine(String line, char delimiter) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == delimiter && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens.toArray(new String[0]);
    }

    private static Instant parseDateTime(String raw, ZoneId zone) {
        if (raw == null || raw.isBlank()) return null;
        for (DateTimeFormatter dtf : DATE_TIME_FORMATTERS) {
            try {
                LocalDateTime ldt = LocalDateTime.parse(raw, dtf);
                return ldt.atZone(zone).toInstant();
            } catch (DateTimeParseException ignored) {}
        }
        try {
            return Instant.parse(raw);
        } catch (DateTimeParseException ignored) {}
        return null;
    }

    private static Instant parseDateAndTime(String dateRaw, String timeRaw, ZoneId zone) {
        LocalDate date = null;
        for (DateTimeFormatter df : DATE_FORMATTERS) {
            try {
                date = LocalDate.parse(dateRaw, df);
                break;
            } catch (DateTimeParseException ignored) {}
        }
        if (date == null) return null;

        LocalTime time = null;
        for (DateTimeFormatter tf : TIME_FORMATTERS) {
            try {
                time = LocalTime.parse(timeRaw, tf);
                break;
            } catch (DateTimeParseException ignored) {}
        }
        if (time == null) return null;

        return LocalDateTime.of(date, time).atZone(zone).toInstant();
    }

    private static LogEventType parseEventType(String raw) {
        if (raw == null || raw.isBlank()) return LogEventType.IN;
        String s = raw.trim().toLowerCase(Locale.ROOT);
        if (s.equals("1") || s.contains("out") || s.contains("ra")) {
            return LogEventType.OUT;
        }
        return LogEventType.IN;
    }
}

