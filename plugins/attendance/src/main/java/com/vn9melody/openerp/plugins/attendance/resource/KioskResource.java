package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
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

