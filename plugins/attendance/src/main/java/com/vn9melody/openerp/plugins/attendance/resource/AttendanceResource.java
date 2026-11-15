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
import com.vn9melody.openerp.plugins.attendance.model.LogSource;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceLogService;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceRecordMapper;
import com.vn9melody.openerp.plugins.attendance.service.KioskSecurityService;
import com.vn9melody.openerp.plugins.attendance.service.PluginDataPager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AttendanceResource {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Inject
    AttendanceLogService logService;

    @Inject
    KioskSecurityService kioskSecurityService;

    @Inject
    TenantContext tenantContext;

    @Inject
    PluginDataClient client;

    @POST
    @Path("/check-in")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<CheckInResponse> checkIn(
            @HeaderParam("X-Client-Platform") String platform,
            CheckInRequest request
    ) {
        UUID employeeId = requireCurrentEmployeeId();
        LogSource source = "mobile".equalsIgnoreCase(platform) ? LogSource.MOBILE : LogSource.WEB;

        CheckInResponse response = logService.checkIn(employeeId, request, source, null, null);
        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_CHECKIN_SUCCESS, "Checked in successfully", response);
    }

    @POST
    @Path("/check-out")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<CheckOutResponse> checkOut(
            @HeaderParam("X-Client-Platform") String platform
    ) {
        UUID employeeId = requireCurrentEmployeeId();
        LogSource source = "mobile".equalsIgnoreCase(platform) ? LogSource.MOBILE : LogSource.WEB;

        CheckOutResponse response = logService.checkOut(employeeId, source, null);
        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_CHECKOUT_SUCCESS, "Checked out successfully", response);
    }

    @GET
    @Path("/my-status")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<MyStatusResponse> myStatus() {
        UUID employeeId = requireCurrentEmployeeId();
        LocalDate today = LocalDate.now(DEFAULT_ZONE);

        LogDto lastLog = logService.getLastLog(employeeId, today);
        LogDto openCheckin = (lastLog != null && lastLog.eventType() == com.vn9melody.openerp.plugins.attendance.model.LogEventType.IN)
                ? lastLog : null;

        Map<UUID, Map<String, Object>> shifts = new LinkedHashMap<>();
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.shift.list",
                Map.of("is_active", true), 100)) {
            if (row.get("id") != null) {
                shifts.put(UUID.fromString(row.get("id").toString()), row);
            }
        }

        LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);
        Map<String, Map<String, Object>> recordsByDate = new LinkedHashMap<>();
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.record.list_range",
                Map.of("employee_id", employeeId.toString(), "from", monday.toString(), "to", sunday.toString()),
                1000)) {
            if (row.get("work_date") != null) {
                recordsByDate.put(row.get("work_date").toString(), row);
            }
        }

        List<Map<String, Object>> week = new ArrayList<>();
        ShiftSummaryDto todayShift = null;
        for (LocalDate date = monday; !date.isAfter(sunday); date = date.plusDays(1)) {
            UUID shiftId = assignedShift(employeeId, date);
            Map<String, Object> shift = shiftId != null ? shifts.get(shiftId) : null;
            String shiftName = shift != null && shift.get("name") != null ? shift.get("name").toString() : null;
            Map<String, Object> record = recordsByDate.get(date.toString());
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", date.toString());
            day.put("shift", shiftName);
            day.put("shift_code", shift != null ? shift.get("code") : null);
            day.put("status", record != null ? record.get("status") : null);
            week.add(day);
            if (date.equals(today) && shift != null) {
                todayShift = new ShiftSummaryDto(
                        shiftId,
                        shift.get("code") != null ? shift.get("code").toString() : null,
                        shiftName,
                        shift.get("start_time") != null ? java.time.LocalTime.parse(shift.get("start_time").toString()) : null,
                        shift.get("end_time") != null ? java.time.LocalTime.parse(shift.get("end_time").toString()) : null,
                        shift.get("working_minutes") instanceof Number number ? number.intValue() : 480
                );
            }
        }

        Map<String, Object> todayRow = recordsByDate.get(today.toString());
        RecordSummaryDto todayRecord = todayRow == null ? null : new RecordSummaryDto(
                todayRow.get("id") != null ? UUID.fromString(todayRow.get("id").toString()) : null,
                today,
                todayRow.get("status") != null
                        ? com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus.valueOf(todayRow.get("status").toString())
                        : null,
                todayRow.get("effective_in") != null ? java.time.Instant.parse(todayRow.get("effective_in").toString()) : null,
                todayRow.get("effective_out") != null ? java.time.Instant.parse(todayRow.get("effective_out").toString()) : null,
                todayRow.get("worked_minutes") instanceof Number n ? n.intValue() : 0,
                todayRow.get("late_minutes") instanceof Number n ? n.intValue() : 0,
                todayRow.get("early_leave_minutes") instanceof Number n ? n.intValue() : 0,
                todayRow.get("ot_minutes") instanceof Number n ? n.intValue() : 0,
                Boolean.TRUE.equals(todayRow.get("is_override")),
                Boolean.TRUE.equals(todayRow.get("needs_review"))
        );

        MyStatusResponse response = new MyStatusResponse(
                openCheckin,
                lastLog,
                todayRecord,
                todayShift,
                week
        );
        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_MY_STATUS_SUCCESS, "My status retrieved", response);
    }

    private UUID assignedShift(UUID employeeId, LocalDate date) {
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.assignment.list_by_date",
                Map.of("work_date", date.toString()), 500)) {
            if (row.get("employee_id") != null && employeeId.toString().equals(row.get("employee_id").toString())
                    && row.get("shift_definition_id") != null) {
                return UUID.fromString(row.get("shift_definition_id").toString());
            }
        }
        return null;
    }

    @PUT
    @Path("/my-kiosk-pin")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<Map<String, Object>> setMyKioskPin(SetKioskPinRequest request) {
        UUID employeeId = requireCurrentEmployeeId();
        String pin = request != null ? request.pin() : null;
        if (pin == null || !pin.matches("\\d{4,6}")) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "PIN must be 4-6 digits", Map.of());
        }
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", employeeId);
        params.put("kiosk_pin_hash", kioskSecurityService.hashPin(pin));
        params.put("kiosk_pin_updated_at", java.time.Instant.now());
        client.write("attendance.employee_ref.set_kiosk_pin", params);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("employee_id", employeeId);
        result.put("updated_at", java.time.Instant.now().toString());
        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_MY_KIOSK_PIN_SUCCESS,
                "Kiosk PIN updated", result);
    }

    @GET
    @Path("/my-logs")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<PagedData<LogDto>> myLogs(
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("50") int size
    ) {
        UUID employeeId = requireCurrentEmployeeId();
        LocalDate from = fromStr != null ? LocalDate.parse(fromStr) : null;
        LocalDate to = toStr != null ? LocalDate.parse(toStr) : null;

        List<LogDto> logs = logService.listEmployeeLogs(employeeId, from, to);
        int total = logs.size();

        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_MY_LOGS_SUCCESS,
                "My logs retrieved",
                logs,
                page,
                size,
                total
        );
    }

    @GET
    @Path("/my-schedule")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<ListData<ShiftAssignmentDto>> mySchedule(
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr
    ) {
        UUID employeeId = requireCurrentEmployeeId();
        LocalDate from = fromStr != null && !fromStr.isBlank()
                ? LocalDate.parse(fromStr) : LocalDate.now(DEFAULT_ZONE).withDayOfMonth(1);
        LocalDate to = toStr != null && !toStr.isBlank()
                ? LocalDate.parse(toStr) : from.withDayOfMonth(from.lengthOfMonth());

        Map<UUID, String> shiftNames = new LinkedHashMap<>();
        for (Map<String, Object> shift : PluginDataPager.listAll(client, "attendance.shift.list",
                Map.of("is_active", true), 100)) {
            if (shift.get("id") != null) {
                shiftNames.put(UUID.fromString(shift.get("id").toString()),
                        shift.get("name") != null ? shift.get("name").toString() : null);
            }
        }

        List<ShiftAssignmentDto> assignments = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.assignment.list_by_date",
                    Map.of("work_date", date.toString()), 500)) {
                if (row.get("employee_id") == null
                        || !employeeId.toString().equals(row.get("employee_id").toString())) {
                    continue;
                }
                UUID id = row.get("id") != null ? UUID.fromString(row.get("id").toString()) : UUID.randomUUID();
                UUID shiftId = row.get("shift_definition_id") != null
                        ? UUID.fromString(row.get("shift_definition_id").toString()) : null;
                assignments.add(new ShiftAssignmentDto(
                        id,
                        employeeId,
                        date,
                        shiftId,
                        shiftNames.get(shiftId),
                        row.get("source") != null ? row.get("source").toString() : null,
                        row.get("reason") != null ? row.get("reason").toString() : null,
                        null,
                        null,
                        null
                ));
            }
        }
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_SCHEDULE_SUCCESS,
                "Schedule retrieved",
                assignments
        );
    }

    @GET
    @Path("/my-records")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<ListData<AttendanceRecordDto>> myRecords(
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr
    ) {
        UUID employeeId = requireCurrentEmployeeId();
        LocalDate from = fromStr != null && !fromStr.isBlank()
                ? LocalDate.parse(fromStr) : LocalDate.now(DEFAULT_ZONE).withDayOfMonth(1);
        LocalDate to = toStr != null && !toStr.isBlank()
                ? LocalDate.parse(toStr) : from.withDayOfMonth(from.lengthOfMonth());

        Map<UUID, Map<String, Object>> employees = new LinkedHashMap<>();
        try {
            PluginQueryResult ref = client.query("attendance.employee_ref.get_by_id",
                    Map.of("employee_id", employeeId.toString()));
            if (!ref.rows().isEmpty()) {
                employees.put(employeeId, ref.rows().get(0));
            }
        } catch (RuntimeException ignored) {
            // Label resolution is best-effort.
        }

        List<AttendanceRecordDto> records = new ArrayList<>();
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.record.list_range",
                Map.of("employee_id", employeeId.toString(), "from", from.toString(), "to", to.toString()),
                1000)) {
            records.add(AttendanceRecordMapper.map(row, employees));
        }
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_RECORD_LIST_SUCCESS,
                "My daily records retrieved",
                records
        );
    }

    private UUID requireCurrentEmployeeId() {
        UUID userId = tenantContext.userId();
        if (userId == null) {
            throw new ApiException(401, AttendanceErrorCode.ATTENDANCE_NOT_EMPLOYEE, "User context required", Map.of());
        }

        try {
            PluginQueryResult res = client.query("attendance.employee_ref.get_by_user_id",
                    Map.of("user_id", userId.toString()));
            if (!res.rows().isEmpty()) {
                Object val = res.rows().get(0).get("employee_id");
                if (val != null) {
                    return UUID.fromString(val.toString());
                }
            }
        } catch (Exception ignored) {}

        // Fallback: If not mapped in projection, use userId directly for dev/test
        return userId;
    }
}

