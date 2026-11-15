package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
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
import com.vn9melody.openerp.plugins.attendance.service.AttendanceAuditService;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceCalculationService;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceLogService;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceRecordMapper;
import com.vn9melody.openerp.plugins.attendance.service.OrgDirectoryService;
import com.vn9melody.openerp.plugins.attendance.service.PluginDataPager;
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

    @Inject
    AttendanceAuditService auditService;

    @Inject
    AttendanceCalculationService calculationService;

    @Inject
    OrgDirectoryService orgDirectory;

    // --- EMPLOYEES ---

    @GET
    @Path("/employees")
    @RequirePermission("attendance:record:read")
    public ApiResponse<ListData<EmployeeRefDto>> listEmployees() {
        Map<UUID, OrgDirectoryService.EmployeeOrg> org = orgDirectory.employeeOrg();
        List<EmployeeRefDto> items = new ArrayList<>();
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.employee_ref.list_all",
                Map.of(), 500)) {
            UUID employeeId = row.get("employee_id") != null
                    ? UUID.fromString(row.get("employee_id").toString()) : null;
            OrgDirectoryService.EmployeeOrg employeeOrg = employeeId != null ? org.get(employeeId) : null;
            items.add(new EmployeeRefDto(
                    employeeId,
                    (String) row.get("employee_code"),
                    (String) row.get("full_name"),
                    row.get("user_id") != null ? UUID.fromString(row.get("user_id").toString()) : null,
                    employeeOrg != null ? employeeOrg.departmentId()
                            : row.get("primary_department_id") != null
                            ? UUID.fromString(row.get("primary_department_id").toString()) : null,
                    (String) row.get("employment_status"),
                    employeeOrg != null ? employeeOrg.departmentName() : null,
                    employeeOrg != null ? employeeOrg.branchId() : null,
                    employeeOrg != null ? employeeOrg.branchName() : null));
        }
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_EMPLOYEE_LIST_SUCCESS,
                "Employees retrieved",
                items
        );
    }

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
        params.put("page", page > 0 ? page - 1 : 0);
        params.put("size", size);

        PluginQueryResult result = client.query("attendance.log.list", params);
        Map<UUID, Map<String, Object>> employees = employeeDirectory();
        List<LogDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapLogRow(row, employees));
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

        auditService.record("LOG_DELETE", "AttendanceLog", id, Map.of("reason", request.reason().trim()));

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
        auditService.record("LOG_ON_BEHALF", "AttendanceLog", result.id(),
                Map.of("employee_id", String.valueOf(result.employeeId()), "event_type", String.valueOf(result.eventType())));
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
        auditService.record("LOG_IMPORT", "AttendanceLog", null,
                Map.of("total", result.total(), "inserted", result.inserted(), "skipped", result.skipped()));
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
        if (needsReview == null || !needsReview) {
            String workDate = (workDateStr != null && !workDateStr.isBlank())
                    ? workDateStr : LocalDate.now().toString();
            params.put("work_date", workDate);
        }
        if (needsReview != null) params.put("needs_review", needsReview);
        params.put("page", page > 0 ? page - 1 : 0);
        params.put("size", size);

        String queryId = Boolean.TRUE.equals(needsReview) ? "attendance.record.list_review" : "attendance.record.list_by_date";
        PluginQueryResult result = client.query(queryId, params);

        Map<UUID, Map<String, Object>> employees = employeeDirectory();
        List<AttendanceRecordDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(AttendanceRecordMapper.map(row, employees));
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

    @GET
    @Path("/records/employee/{employeeId}")
    @RequirePermission("attendance:record:read")
    public ApiResponse<ListData<AttendanceRecordDto>> listEmployeeRecords(
            @PathParam("employeeId") UUID employeeId,
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr
    ) {
        LocalDate from = fromStr != null && !fromStr.isBlank()
                ? LocalDate.parse(fromStr) : LocalDate.now().withDayOfMonth(1);
        LocalDate to = toStr != null && !toStr.isBlank()
                ? LocalDate.parse(toStr) : from.withDayOfMonth(from.lengthOfMonth());
        Map<UUID, Map<String, Object>> employees = employeeDirectory();
        List<AttendanceRecordDto> items = new ArrayList<>();
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.record.list_range",
                Map.of("employee_id", employeeId.toString(), "from", from.toString(), "to", to.toString()),
                1000)) {
            items.add(AttendanceRecordMapper.map(row, employees));
        }
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_RECORD_LIST_SUCCESS,
                "Employee records retrieved",
                items
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

        auditService.record("RECORD_OVERRIDE", "AttendanceRecord", id,
                Map.of("reason", request.reason().trim()));

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
        LocalDate from = request != null && request.from() != null ? request.from() : LocalDate.now();
        LocalDate to = request != null && request.to() != null ? request.to() : from;
        if (to.isBefore(from)) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "to must be on or after from", Map.of());
        }
        if (java.time.temporal.ChronoUnit.DAYS.between(from, to) > 10) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Range must not exceed 10 days per call", Map.of());
        }

        int calculated = calculationService.recalculateRange(from, to);
        auditService.record("RECORD_RECALCULATE", "AttendanceRecord", null,
                Map.of("from", from.toString(), "to", to.toString(), "calculated", calculated));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("from", from.toString());
        result.put("to", to.toString());
        result.put("calculated", calculated);
        result.put("queued_at", Instant.now().toString());
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_RECALC_QUEUED,
                "Attendance recalculated",
                result
        );
    }

    private Map<UUID, Map<String, Object>> employeeDirectory() {
        Map<UUID, Map<String, Object>> employees = new LinkedHashMap<>();
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.employee_ref.list_all",
                Map.of(), 500)) {
            if (row.get("employee_id") != null) {
                employees.put(UUID.fromString(row.get("employee_id").toString()), row);
            }
        }
        return employees;
    }

    private LogDto mapLogRow(Map<String, Object> row, Map<UUID, Map<String, Object>> employees) {
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

        Map<String, Object> employee = empId != null ? employees.get(empId) : null;
        String employeeCode = employee != null && employee.get("employee_code") != null
                ? employee.get("employee_code").toString() : "";
        String employeeName = employee != null && employee.get("full_name") != null
                ? employee.get("full_name").toString() : "";
        return new LogDto(
                id,
                empId,
                employeeCode,
                employeeName,
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
        return AttendanceRecordMapper.map(row, employeeDirectory());
    }
}

