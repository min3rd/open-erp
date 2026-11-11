package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.*;
import com.vn9melody.openerp.plugins.attendance.engine.CsvLogParser;
import com.vn9melody.openerp.plugins.attendance.engine.GeofenceCalculator;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceModels.BranchLocation;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import com.vn9melody.openerp.plugins.attendance.model.LogSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

/**
 * Orchestrator for all 5 attendance ingestion pathways (ADR-S09-005):
 * 1. Web Self
 * 2. Mobile GPS (with Haversine distance geofencing warning)
 * 3. Kiosk PIN
 * 4. BioTime / ZKTeco CSV Import
 * 5. Hardware Push API
 */
@ApplicationScoped
public class AttendanceLogService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int DEFAULT_GEOFENCE_RADIUS_METERS = 200;

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    @Inject
    ObjectMapper objectMapper;

    /**
     * Records an IN punch (Check-in).
     */
    public CheckInResponse checkIn(UUID employeeId, CheckInRequest request, LogSource source,
                                   Map<String, Object> additionalMeta, BranchLocation branchLocation) {
        if (employeeId == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_NOT_EMPLOYEE, "Employee ID is required", Map.of());
        }

        LocalDate workDate = LocalDate.now(DEFAULT_ZONE);
        Instant now = Instant.now();

        // 1. Detect open check-in: if last log was IN without subsequent OUT, reject
        LogDto lastLog = getLastLog(employeeId, workDate);
        if (lastLog != null && lastLog.eventType() == LogEventType.IN) {
            throw new ApiException(409, AttendanceErrorCode.ATTENDANCE_ALREADY_CHECKED_IN,
                    "Employee is already checked in for the current shift/day",
                    Map.of("employee_id", employeeId.toString(), "last_in_at", lastLog.occurredAt().toString()));
        }

        // 2. Geofence evaluation for mobile punch
        boolean geofenceFlag = false;
        Map<String, Object> meta = new HashMap<>(additionalMeta != null ? additionalMeta : Map.of());

        if (source == LogSource.MOBILE && request != null && request.gps() != null) {
            meta.put("gps_lat", request.gps().lat());
            meta.put("gps_lng", request.gps().lng());

            if (branchLocation != null && branchLocation.latitude() != 0 && branchLocation.longitude() != 0) {
                int radius = branchLocation.radiusMeters() > 0 ? branchLocation.radiusMeters() : DEFAULT_GEOFENCE_RADIUS_METERS;
                double distance = GeofenceCalculator.distanceMeters(
                        request.gps().lat(), request.gps().lng(),
                        branchLocation.latitude(), branchLocation.longitude()
                );
                meta.put("branch_distance_m", Math.round(distance));
                if (distance > radius) {
                    geofenceFlag = true;
                    meta.put("geofence_warning", true);
                    meta.put("geofence_radius_m", radius);
                }
            }
        }

        // 3. Write log to plg_attendance_logs
        UUID logId = UUID.randomUUID();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", employeeId);
        params.put("event_type", LogEventType.IN.name());
        params.put("occurred_at", now.toString());
        params.put("work_date", workDate.toString());
        params.put("source", source.name());
        params.put("device_id", meta.get("device_id") != null ? meta.get("device_id") : null);
        params.put("meta", serializeJson(meta));

        PluginQueryResult result = client.write("attendance.log.insert", params);
        if (!result.rows().isEmpty()) {
            Object idVal = result.rows().get(0).get("id");
            if (idVal != null) {
                logId = UUID.fromString(idVal.toString());
            }
        }

        return new CheckInResponse(
                logId,
                employeeId,
                workDate,
                "STANDARD",
                "Ca chuẩn",
                now,
                geofenceFlag,
                source
        );
    }

    /**
     * Records an OUT punch (Check-out).
     */
    public CheckOutResponse checkOut(UUID employeeId, LogSource source, Map<String, Object> additionalMeta) {
        if (employeeId == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_NOT_EMPLOYEE, "Employee ID is required", Map.of());
        }

        LocalDate workDate = LocalDate.now(DEFAULT_ZONE);
        Instant now = Instant.now();

        // 1. Verify open check-in exists
        LogDto lastLog = getLastLog(employeeId, workDate);
        if (lastLog == null || lastLog.eventType() != LogEventType.IN) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_NO_OPEN_CHECKIN,
                    "No open check-in found to check out from",
                    Map.of("employee_id", employeeId.toString()));
        }

        // 2. Write OUT log
        UUID logId = UUID.randomUUID();
        Map<String, Object> meta = new HashMap<>(additionalMeta != null ? additionalMeta : Map.of());

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", employeeId);
        params.put("event_type", LogEventType.OUT.name());
        params.put("occurred_at", now.toString());
        params.put("work_date", workDate.toString());
        params.put("source", source.name());
        params.put("device_id", meta.get("device_id") != null ? meta.get("device_id") : null);
        params.put("meta", serializeJson(meta));

        PluginQueryResult result = client.write("attendance.log.insert", params);
        if (!result.rows().isEmpty()) {
            Object idVal = result.rows().get(0).get("id");
            if (idVal != null) {
                logId = UUID.fromString(idVal.toString());
            }
        }

        return new CheckOutResponse(
                logId,
                employeeId,
                workDate,
                now,
                source
        );
    }

    /**
     * Records on-behalf check-in/out by HR or Manager (Source: MANUAL).
     */
    public LogDto onBehalf(UUID enteredBy, OnBehalfLogRequest request) {
        if (request == null || request.employeeId() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_NOT_EMPLOYEE, "employee_id is required", Map.of());
        }
        if (request.reason() == null || request.reason().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_LOG_DELETE_REASON_REQUIRED,
                    "Reason is required for on-behalf punch", Map.of());
        }

        Instant occurredAt = request.occurredAt() != null ? request.occurredAt() : Instant.now();
        LocalDate workDate = occurredAt.atZone(DEFAULT_ZONE).toLocalDate();

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("entered_by", enteredBy != null ? enteredBy.toString() : "SYSTEM");
        meta.put("entered_reason", request.reason().trim());

        UUID logId = UUID.randomUUID();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", request.employeeId());
        params.put("event_type", request.eventType().name());
        params.put("occurred_at", occurredAt.toString());
        params.put("work_date", workDate.toString());
        params.put("source", LogSource.MANUAL.name());
        params.put("device_id", null);
        params.put("meta", serializeJson(meta));

        PluginQueryResult result = client.write("attendance.log.insert", params);
        if (!result.rows().isEmpty()) {
            Object idVal = result.rows().get(0).get("id");
            if (idVal != null) {
                logId = UUID.fromString(idVal.toString());
            }
        }

        return new LogDto(
                logId,
                request.employeeId(),
                "",
                "",
                request.eventType(),
                occurredAt,
                workDate,
                LogSource.MANUAL,
                null,
                meta,
                null,
                null,
                null,
                Instant.now()
        );
    }

    /**
     * Soft deletes an attendance log with mandatory audit reason.
     */
    public void deleteLog(UUID logId, UUID deletedBy, String reason) {
        if (logId == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_LOG_NOT_FOUND, "Log ID is required", Map.of());
        }
        if (reason == null || reason.isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_LOG_DELETE_REASON_REQUIRED,
                    "Reason is required to delete attendance log", Map.of());
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", logId);
        params.put("deleted_by", deletedBy);
        params.put("deleted_reason", reason.trim());
        params.put("deleted_at", Instant.now().toString());

        client.write("attendance.log.soft_delete", params);
    }

    /**
     * Imports logs from BioTime / ZKTeco CSV file.
     */
    public ImportResult importLogs(String csvContent, UUID currentUserId) {
        CsvLogParser.ParseResult parsed = CsvLogParser.parse(csvContent, DEFAULT_ZONE);
        int total = parsed.entries().size() + parsed.errors().size();
        int inserted = 0;
        int skipped = 0;
        List<ImportRowError> errors = new ArrayList<>(parsed.errors());

        for (CsvLogParser.ParsedLogEntry entry : parsed.entries()) {
            try {
                // Lookup employee reference by employeeCode
                UUID employeeId = resolveEmployeeId(entry.employeeCode());
                if (employeeId == null) {
                    errors.add(new ImportRowError(entry.rowIndex(), entry.employeeCode(), "Employee code not found"));
                    skipped++;
                    continue;
                }

                LocalDate workDate = entry.occurredAt().atZone(DEFAULT_ZONE).toLocalDate();
                Map<String, Object> meta = new LinkedHashMap<>();
                if (entry.deviceCode() != null) {
                    meta.put("device_code", entry.deviceCode());
                }
                meta.put("imported_by", currentUserId != null ? currentUserId.toString() : "SYSTEM");

                Map<String, Object> params = new LinkedHashMap<>();
                params.put("employee_id", employeeId);
                params.put("event_type", entry.eventType().name());
                params.put("occurred_at", entry.occurredAt().toString());
                params.put("work_date", workDate.toString());
                params.put("source", LogSource.IMPORT.name());
                params.put("device_id", null);
                params.put("meta", serializeJson(meta));

                client.write("attendance.log.insert", params);
                inserted++;
            } catch (Exception ex) {
                // Machine unique constraint violation or DB conflict
                skipped++;
            }
        }

        return new ImportResult(total, inserted, skipped, errors);
    }

    /**
     * Ingests batch push events from hardware / middleware.
     */
    public PushIngestResponse ingestPush(UUID deviceId, PushIngestRequest request) {
        if (request == null || request.events() == null || request.events().isEmpty()) {
            return new PushIngestResponse(0, 0, List.of());
        }

        int inserted = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        for (PushEvent event : request.events()) {
            try {
                UUID employeeId = resolveEmployeeId(event.employeeCode());
                if (employeeId == null) {
                    errors.add("Employee not found: " + event.employeeCode());
                    skipped++;
                    continue;
                }

                LocalDate workDate = event.occurredAt().atZone(DEFAULT_ZONE).toLocalDate();
                Map<String, Object> meta = new HashMap<>(event.meta() != null ? event.meta() : Map.of());
                meta.put("push_device_id", deviceId != null ? deviceId.toString() : null);

                Map<String, Object> params = new LinkedHashMap<>();
                params.put("employee_id", employeeId);
                params.put("event_type", event.eventType().name());
                params.put("occurred_at", event.occurredAt().toString());
                params.put("work_date", workDate.toString());
                params.put("source", LogSource.PUSH.name());
                params.put("device_id", deviceId);
                params.put("meta", serializeJson(meta));

                client.write("attendance.log.insert", params);
                inserted++;
            } catch (Exception ex) {
                skipped++;
            }
        }

        return new PushIngestResponse(inserted, skipped, errors);
    }

    /**
     * Retrieves recent logs for an employee.
     */
    public List<LogDto> listEmployeeLogs(UUID employeeId, LocalDate from, LocalDate to) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", employeeId);
        if (from != null) params.put("from", from.toString());
        if (to != null) params.put("to", to.toString());

        PluginQueryResult result = client.query("attendance.log.list_by_employee", params);
        List<LogDto> list = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            list.add(mapLogRow(row));
        }
        return list;
    }

    /**
     * Gets the latest active log for an employee on a given work date.
     */
    public LogDto getLastLog(UUID employeeId, LocalDate workDate) {
        List<LogDto> logs = listEmployeeLogs(employeeId, workDate, workDate);
        if (logs.isEmpty()) {
            return null;
        }
        // sort by occurred_at desc
        logs.sort(Comparator.comparing(LogDto::occurredAt).reversed());
        for (LogDto log : logs) {
            if (log.deletedAt() == null) {
                return log;
            }
        }
        return null;
    }

    private UUID resolveEmployeeId(String employeeCode) {
        if (employeeCode == null || employeeCode.isBlank()) {
            return null;
        }
        try {
            PluginQueryResult res = client.query("attendance.employee_ref.get_by_code",
                    Map.of("employee_code", employeeCode.trim()));
            if (!res.rows().isEmpty()) {
                Object val = res.rows().get(0).get("employee_id");
                if (val != null) {
                    return UUID.fromString(val.toString());
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private LogDto mapLogRow(Map<String, Object> row) {
        UUID id = row.get("id") != null ? UUID.fromString(row.get("id").toString()) : UUID.randomUUID();
        UUID empId = row.get("employee_id") != null ? UUID.fromString(row.get("employee_id").toString()) : null;
        LogEventType eventType = row.get("event_type") != null ? LogEventType.valueOf(row.get("event_type").toString()) : LogEventType.IN;
        Instant occurredAt = row.get("occurred_at") != null ? Instant.parse(row.get("occurred_at").toString()) : Instant.now();
        LocalDate workDate = row.get("work_date") != null ? LocalDate.parse(row.get("work_date").toString()) : LocalDate.now(DEFAULT_ZONE);
        LogSource source = row.get("source") != null ? LogSource.valueOf(row.get("source").toString()) : LogSource.WEB;
        UUID deviceId = row.get("device_id") != null ? UUID.fromString(row.get("device_id").toString()) : null;
        Instant deletedAt = row.get("deleted_at") != null ? Instant.parse(row.get("deleted_at").toString()) : null;

        Map<String, Object> meta = Map.of();
        Object metaObj = row.get("meta");
        if (metaObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> m = (Map<String, Object>) metaObj;
            meta = m;
        }

        return new LogDto(
                id,
                empId,
                "",
                "",
                eventType,
                occurredAt,
                workDate,
                source,
                deviceId,
                meta,
                null,
                null,
                deletedAt,
                occurredAt
        );
    }

    private String serializeJson(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}

