package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import com.vn9melody.openerp.plugins.attendance.model.LogSource;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceLogService;
import com.vn9melody.openerp.plugins.attendance.service.KioskSecurityService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Public and session-based endpoints for Attendance Kiosk tablets (ADR-S09-005 §2.1, DES-API §2).
 */
@Path("/kiosks")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class KioskResource {

    @Inject
    KioskSecurityService securityService;

    @Inject
    AttendanceLogService logService;

    @Inject
    PluginDataClient client;

    @GET
    @Path("/{deviceCode}/employees")
    public ApiResponse<ListData<KioskEmployeeDto>> listEmployees(
            @PathParam("deviceCode") String deviceCode,
            @QueryParam("search") String search,
            @QueryParam("department") String department
    ) {
        // 1. Lookup device
        Map<String, Object> device = getDeviceByCode(deviceCode);
        if (device == null) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_DEVICE_NOT_FOUND, "Kiosk device not found", Map.of());
        }
        if (!Boolean.TRUE.equals(device.get("is_active"))) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_DEVICE_INACTIVE, "Kiosk device is inactive", Map.of());
        }

        // 2. Query employee refs synchronized with employee plugin
        List<KioskEmployeeDto> employees = new ArrayList<>();
        try {
            PluginQueryResult res = client.query("attendance.employee_ref.list_all", Map.of());
            if (res != null && res.rows() != null) {
                for (Map<String, Object> row : res.rows()) {
                    String code = (String) row.get("employee_code");
                    String name = (String) row.get("full_name");
                    String dept = row.get("primary_department_id") != null ? "Phòng Kỹ thuật" : "Doanh nghiệp";
                    String initials = getInitials(name);
                    employees.add(new KioskEmployeeDto(
                            row.get("employee_id") != null ? row.get("employee_id").toString() : UUID.randomUUID().toString(),
                            code != null ? code : "EMP-000",
                            name != null ? name : "Nhân viên",
                            dept,
                            initials,
                            row.get("photo_url") != null ? row.get("photo_url").toString() : null,
                            row.get("work_email") != null ? row.get("work_email").toString() : null,
                            row.get("phone") != null ? row.get("phone").toString() : null,
                            row.get("job_title") != null ? row.get("job_title").toString() : null,
                            false,
                            null,
                            null
                    ));
                }
            }
        } catch (Exception ignored) {}

        return ApiResponse.successList(AttendanceErrorCode.KIOSK_EMPLOYEES_LIST_SUCCESS, "Kiosk employee directory retrieved", employees);
    }

    private String getInitials(String name) {
        if (name == null || name.isBlank()) return "NV";
        String[] parts = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!p.isEmpty()) sb.append(p.charAt(0));
        }
        return sb.length() > 3 ? sb.substring(sb.length() - 3).toUpperCase() : sb.toString().toUpperCase();
    }

    @POST
    @Path("/{deviceCode}/authenticate")
    public ApiResponse<KioskAuthResponse> authenticate(
            @PathParam("deviceCode") String deviceCode,
            KioskAuthRequest request
    ) {
        if (request == null || request.employeeCode() == null || request.employeeCode().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.KIOSK_AUTH_FAILED, "employee_code is required", Map.of());
        }
        if (request.pin() == null || request.pin().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.KIOSK_AUTH_FAILED, "PIN is required", Map.of());
        }

        // 1. Lookup device
        Map<String, Object> device = getDeviceByCode(deviceCode);
        if (device == null) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_DEVICE_NOT_FOUND, "Kiosk device not found", Map.of());
        }
        if (!Boolean.TRUE.equals(device.get("is_active"))) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_DEVICE_INACTIVE, "Kiosk device is inactive", Map.of());
        }

        UUID deviceId = UUID.fromString(device.get("id").toString());
        String expectedPinHash = (String) device.get("pin_hash");
        Instant lockedUntil = device.get("locked_until") != null ? Instant.parse(device.get("locked_until").toString()) : null;

        // 2. Lookup employee
        Map<String, Object> empRef = getEmployeeRef(request.employeeCode().trim());
        if (empRef == null) {
            throw new ApiException(401, AttendanceErrorCode.KIOSK_AUTH_FAILED, "Employee not found", Map.of());
        }
        UUID employeeId = UUID.fromString(empRef.get("employee_id").toString());
        String fullName = (String) empRef.get("full_name");

        // 3. Authenticate PIN with brute force protection
        KioskSecurityService.KioskSession session = securityService.authenticate(
                deviceId, null, request.employeeCode().trim(), request.pin(), expectedPinHash,
                lockedUntil, employeeId, fullName
        );

        KioskAuthResponse response = new KioskAuthResponse(
                session.sessionToken(),
                KioskSecurityService.SESSION_TTL.toSeconds(),
                session.employeeCode(),
                session.employeeName()
        );

        return ApiResponse.success(AttendanceErrorCode.KIOSK_AUTH_SUCCESS, "Authenticated successfully", response);
    }

    @POST
    @Path("/{deviceCode}/punch")
    public ApiResponse<KioskPunchResponse> punch(
            @PathParam("deviceCode") String deviceCode,
            @HeaderParam("X-Kiosk-Session-Token") String sessionToken,
            KioskPunchRequest request
    ) {
        if (request == null || request.eventType() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR, "event_type is required", Map.of());
        }

        // Validate session
        KioskSecurityService.KioskSession session = securityService.validateSession(sessionToken);

        Map<String, Object> device = getDeviceByCode(deviceCode);
        if (device == null) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_DEVICE_NOT_FOUND, "Kiosk device not found", Map.of());
        }
        UUID deviceId = UUID.fromString(device.get("id").toString());

        UUID logId = UUID.randomUUID();
        Instant now = Instant.now();

        Map<String, Object> meta = Map.of("device_code", deviceCode, "device_id", deviceId.toString());

        if (request.eventType() == LogEventType.IN) {
            CheckInResponse inResp = logService.checkIn(session.employeeId(), null, LogSource.KIOSK, meta, null);
            logId = inResp.logId();
        } else {
            CheckOutResponse outResp = logService.checkOut(session.employeeId(), LogSource.KIOSK, meta);
            logId = outResp.logId();
        }

        // Consume session after punch
        securityService.invalidateSession(sessionToken);

        KioskPunchResponse response = new KioskPunchResponse(
                logId,
                session.employeeCode(),
                request.eventType(),
                now
        );

        return ApiResponse.success(AttendanceErrorCode.KIOSK_PUNCH_SUCCESS, "Punch recorded successfully", response);
    }

    private Map<String, Object> getDeviceByCode(String deviceCode) {
        try {
            PluginQueryResult res = client.query("attendance.device.get_by_code", Map.of("device_code", deviceCode.trim()));
            return res.first();
        } catch (Exception ignored) {
            return null;
        }
    }

    private Map<String, Object> getEmployeeRef(String employeeCode) {
        try {
            PluginQueryResult res = client.query("attendance.employee_ref.get_by_code", Map.of("employee_code", employeeCode.trim()));
            return res.first();
        } catch (Exception ignored) {
            return null;
        }
    }
}

