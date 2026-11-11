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
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Path("/attendance")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AttendanceResource {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Inject
    AttendanceLogService logService;

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

        MyStatusResponse response = new MyStatusResponse(
                openCheckin,
                lastLog,
                null,
                null
        );
        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_MY_STATUS_SUCCESS, "My status retrieved", response);
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
        List<ShiftAssignmentDto> assignments = new ArrayList<>();
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_SCHEDULE_SUCCESS,
                "Schedule retrieved",
                assignments
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

