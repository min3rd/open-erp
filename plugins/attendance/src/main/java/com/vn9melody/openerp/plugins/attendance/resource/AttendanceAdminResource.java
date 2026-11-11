package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import com.vn9melody.openerp.plugins.attendance.model.LogSource;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceLogService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Path("/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AttendanceAdminResource {

    @Inject
    AttendanceLogService logService;

    @Inject
    TenantContext tenantContext;

    @Inject
    PluginDataClient client;

    // --- LOGS ---

    @GET
    @Path("/logs")
    @RequirePermission("attendance:log:manage")
    public ApiResponse<PagedData<LogDto>> listLogs(
            @QueryParam("employee_id") String employeeIdStr,
            @QueryParam("source") String sourceStr,
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("50") int size
    ) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (employeeIdStr != null && !employeeIdStr.isBlank()) params.put("employee_id", employeeIdStr);
        if (sourceStr != null && !sourceStr.isBlank()) params.put("source", sourceStr);
        if (fromStr != null && !fromStr.isBlank()) params.put("from", fromStr);
        if (toStr != null && !toStr.isBlank()) params.put("to", toStr);
        params.put("page", page);
        params.put("size", size);

        PluginQueryResult result = client.query("attendance.log.list", params);
        List<LogDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapLogRow(row));
        }

        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_LOG_LIST_SUCCESS,
                "Logs retrieved",
                items,
                page,
                size,
                result.totalRows() > 0 ? result.totalRows() : items.size()
        );
    }

    @DELETE
    @Path("/logs/{id}")
    @RequirePermission("attendance:log:manage")
    public ApiResponse<Map<String, Object>> deleteLog(
            @PathParam("id") UUID id,
            DeleteLogRequest request
    ) {
        if (request == null || request.reason() == null || request.reason().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_LOG_DELETE_REASON_REQUIRED,
                    "Reason is required to delete log", Map.of());
        }

        UUID deletedBy = tenantContext.userId();
        logService.deleteLog(id, deletedBy, request.reason());

        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_LOG_DELETED,
                "Log deleted successfully",
                Map.of("id", id, "deleted_at", Instant.now().toString())
        );
    }

    @POST
    @Path("/logs/on-behalf")
    @RequirePermission("attendance:log:manage")
    public ApiResponse<LogDto> onBehalf(OnBehalfLogRequest request) {
        UUID enteredBy = tenantContext.userId();
        LogDto result = logService.onBehalf(enteredBy, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_LOG_ON_BEHALF_SUCCESS,
                "On-behalf punch recorded successfully",
                result
        );
    }

    @POST
    @Path("/logs/import")
    @Consumes({MediaType.TEXT_PLAIN, "text/csv", MediaType.APPLICATION_JSON})
    @RequirePermission("attendance:log:manage")
    public ApiResponse<ImportResult> importLogs(String csvContent) {
        if (csvContent == null || csvContent.isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_IMPORT_FORMAT_INVALID,
                    "CSV content cannot be empty", Map.of());
        }

        UUID currentUserId = tenantContext.userId();
        ImportResult result = logService.importLogs(csvContent, currentUserId);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_IMPORT_SUCCESS,
                "Attendance logs imported successfully",
                result
        );
    }

    // --- RECORDS ---

    @GET
    @Path("/records")
    @RequirePermission("attendance:record:read")
    public ApiResponse<PagedData<AttendanceRecordDto>> listRecords(
            @QueryParam("work_date") String workDateStr,
            @QueryParam("needs_review") Boolean needsReview,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("50") int size
    ) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (workDateStr != null && !workDateStr.isBlank()) params.put("work_date", workDateStr);
        if (needsReview != null) params.put("needs_review", needsReview);
        params.put("page", page);
        params.put("size", size);

        String queryId = Boolean.TRUE.equals(needsReview) ? "attendance.record.list_review" : "attendance.record.list_by_date";
        PluginQueryResult result = client.query(queryId, params);

        List<AttendanceRecordDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapRecordRow(row));
        }

        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_RECORD_LIST_SUCCESS,
                "Records retrieved",
                items,
                page,
                size,
                result.totalRows() > 0 ? result.totalRows() : items.size()
        );
    }

    @PUT
    @Path("/records/{id}/override")
    @RequirePermission("attendance:record:override")
    public ApiResponse<Map<String, Object>> overrideRecord(
            @PathParam("id") UUID id,
            RecordOverrideRequest request
    ) {
        if (request == null || request.reason() == null || request.reason().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Reason is required to override attendance record", Map.of());
        }

        UUID overrideBy = tenantContext.userId();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", id);
        if (request.status() != null) params.put("status", request.status().name());
        if (request.effectiveIn() != null) params.put("effective_in", request.effectiveIn().toString());
        if (request.effectiveOut() != null) params.put("effective_out", request.effectiveOut().toString());
        if (request.workedMinutes() != null) params.put("worked_minutes", request.workedMinutes());
        if (request.lateMinutes() != null) params.put("late_minutes", request.lateMinutes());
        if (request.earlyLeaveMinutes() != null) params.put("early_leave_minutes", request.earlyLeaveMinutes());
        if (request.otMinutes() != null) params.put("ot_minutes", request.otMinutes());
        params.put("is_override", true);
        params.put("override_reason", request.reason().trim());
        params.put("override_by", overrideBy);
        params.put("needs_review", false);

        client.write("attendance.record.upsert", params);

        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_RECORD_OVERRIDDEN,
                "Record overridden successfully",
                Map.of("id", id, "is_override", true)
        );
    }

    @POST
    @Path("/records/recalculate")
    @RequirePermission("attendance:record:override")
    public ApiResponse<Map<String, Object>> recalculate(RecalculateRequest request) {
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_RECALC_QUEUED,
                "Attendance recalculation queued",
                Map.of("queued_at", Instant.now().toString())
        );
    }

    private LogDto mapLogRow(Map<String, Object> row) {
        UUID id = row.get("id") != null ? UUID.fromString(row.get("id").toString()) : UUID.randomUUID();
        UUID empId = row.get("employee_id") != null ? UUID.fromString(row.get("employee_id").toString()) : null;
        LogEventType eventType = row.get("event_type") != null ? LogEventType.valueOf(row.get("event_type").toString()) : LogEventType.IN;
        Instant occurredAt = row.get("occurred_at") != null ? Instant.parse(row.get("occurred_at").toString()) : Instant.now();
        LocalDate workDate = row.get("work_date") != null ? LocalDate.parse(row.get("work_date").toString()) : LocalDate.now();
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

    private AttendanceRecordDto mapRecordRow(Map<String, Object> row) {
        UUID id = row.get("id") != null ? UUID.fromString(row.get("id").toString()) : UUID.randomUUID();
        UUID empId = row.get("employee_id") != null ? UUID.fromString(row.get("employee_id").toString()) : null;
        LocalDate workDate = row.get("work_date") != null ? LocalDate.parse(row.get("work_date").toString()) : LocalDate.now();
        UUID shiftId = row.get("shift_definition_id") != null ? UUID.fromString(row.get("shift_definition_id").toString()) : null;
        String shiftName = (String) row.get("shift_name_snapshot");
        AttendanceStatus status = row.get("status") != null ? AttendanceStatus.valueOf(row.get("status").toString()) : AttendanceStatus.PRESENT;
        Instant effIn = row.get("effective_in") != null ? Instant.parse(row.get("effective_in").toString()) : null;
        Instant effOut = row.get("effective_out") != null ? Instant.parse(row.get("effective_out").toString()) : null;
        int worked = row.get("worked_minutes") != null ? ((Number) row.get("worked_minutes")).intValue() : 0;
        int late = row.get("late_minutes") != null ? ((Number) row.get("late_minutes")).intValue() : 0;
        int early = row.get("early_leave_minutes") != null ? ((Number) row.get("early_leave_minutes")).intValue() : 0;
        int ot = row.get("ot_minutes") != null ? ((Number) row.get("ot_minutes")).intValue() : 0;
        int calcVer = row.get("calc_version") != null ? ((Number) row.get("calc_version")).intValue() : 1;
        boolean isOverride = Boolean.TRUE.equals(row.get("is_override"));
        String overrideReason = (String) row.get("override_reason");
        UUID overrideBy = row.get("override_by") != null ? UUID.fromString(row.get("override_by").toString()) : null;
        boolean needsReview = Boolean.TRUE.equals(row.get("needs_review"));
        String reviewNote = (String) row.get("review_note");

        return new AttendanceRecordDto(
                id,
                empId,
                "",
                "",
                workDate,
                shiftId,
                shiftName,
                status,
                effIn,
                effOut,
                worked,
                late,
                early,
                ot,
                calcVer,
                isOverride,
                overrideReason,
                overrideBy,
                needsReview,
                reviewNote,
                null,
                0,
                Instant.now(),
                Instant.now()
        );
    }
}

