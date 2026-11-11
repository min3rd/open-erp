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
import com.vn9melody.openerp.plugins.attendance.model.DeviceType;
import com.vn9melody.openerp.plugins.attendance.service.KioskSecurityService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Path("/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class ShiftAdminResource {

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    @Inject
    KioskSecurityService securityService;

    // --- SHIFTS ---

    @GET
    @Path("/shifts")
    @RequirePermission("attendance:shift:manage")
    public ApiResponse<PagedData<ShiftDto>> listShifts(
            @QueryParam("is_active") Boolean isActive,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("50") int size
    ) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (isActive != null) params.put("is_active", isActive);
        params.put("page", page);
        params.put("size", size);

        PluginQueryResult result = client.query("attendance.shift.list", params);
        List<ShiftDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapShiftRow(row));
        }

        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_SHIFT_LIST_SUCCESS,
                "Shifts retrieved",
                items,
                page,
                size,
                result.totalRows() > 0 ? result.totalRows() : items.size()
        );
    }

    @POST
    @Path("/shifts")
    @RequirePermission("attendance:shift:manage")
    public ApiResponse<ShiftDto> createShift(ShiftDto dto) {
        if (dto == null || dto.code() == null || dto.code().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR, "Shift code is required", Map.of());
        }
        if (dto.startTime() == null || dto.endTime() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR, "Start and end times are required", Map.of());
        }
        if (dto.startTime().equals(dto.endTime())) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_SHIFT_INVALID_TIME, "Start and end times cannot be equal", Map.of());
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("code", dto.code().trim().toUpperCase(Locale.ROOT));
        params.put("name", dto.name() != null ? dto.name().trim() : dto.code());
        params.put("catalog_shift_id", dto.catalogShiftId());
        params.put("start_time", dto.startTime().toString());
        params.put("end_time", dto.endTime().toString());
        params.put("grace_in_minutes", dto.graceInMinutes());
        params.put("grace_out_minutes", dto.graceOutMinutes());
        params.put("break_minutes", dto.breakMinutes());
        params.put("ot_grace_minutes", dto.otGraceMinutes());
        params.put("min_ot_minutes", dto.minOtMinutes() > 0 ? dto.minOtMinutes() : 15);
        params.put("working_minutes", dto.workingMinutes() > 0 ? dto.workingMinutes() : 480);
        params.put("is_active", dto.isActive());

        PluginQueryResult result = client.write("attendance.shift.insert", params);
        UUID id = !result.rows().isEmpty() && result.rows().get(0).get("id") != null
                ? UUID.fromString(result.rows().get(0).get("id").toString()) : UUID.randomUUID();

        ShiftDto created = new ShiftDto(
                id,
                (String) params.get("code"),
                (String) params.get("name"),
                dto.catalogShiftId(),
                dto.startTime(),
                dto.endTime(),
                dto.graceInMinutes(),
                dto.graceOutMinutes(),
                dto.breakMinutes(),
                dto.otGraceMinutes(),
                dto.minOtMinutes(),
                dto.workingMinutes(),
                dto.isActive(),
                Instant.now(),
                Instant.now()
        );

        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_SHIFT_CREATED, "Shift created successfully", created);
    }

    // --- DEVICES ---

    @GET
    @Path("/devices")
    @RequirePermission("attendance:settings:manage")
    public ApiResponse<PagedData<DeviceResponse>> listDevices(
            @QueryParam("device_type") String deviceTypeStr,
            @QueryParam("is_active") Boolean isActive,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("50") int size
    ) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (deviceTypeStr != null && !deviceTypeStr.isBlank()) params.put("device_type", deviceTypeStr);
        if (isActive != null) params.put("is_active", isActive);
        params.put("page", page);
        params.put("size", size);

        PluginQueryResult result = client.query("attendance.device.list", params);
        List<DeviceResponse> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapDeviceRow(row));
        }

        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_DEVICE_LIST_SUCCESS,
                "Devices retrieved",
                items,
                page,
                size,
                result.totalRows() > 0 ? result.totalRows() : items.size()
        );
    }

    @POST
    @Path("/devices")
    @RequirePermission("attendance:settings:manage")
    public ApiResponse<DeviceResponse> createDevice(DeviceCreateRequest req) {
        if (req == null || req.deviceCode() == null || req.deviceCode().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR, "device_code is required", Map.of());
        }

        String pinHash = req.pin() != null && !req.pin().isBlank() ? securityService.hashPin(req.pin()) : null;

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("name", req.name() != null ? req.name().trim() : req.deviceCode());
        params.put("device_type", req.deviceType() != null ? req.deviceType().name() : DeviceType.KIOSK.name());
        params.put("branch_id", req.branchId());
        params.put("device_code", req.deviceCode().trim());
        params.put("pin_hash", pinHash);
        params.put("ingest_secret_hash", null);
        params.put("is_active", true);

        PluginQueryResult result = client.write("attendance.device.insert", params);
        UUID id = !result.rows().isEmpty() && result.rows().get(0).get("id") != null
                ? UUID.fromString(result.rows().get(0).get("id").toString()) : UUID.randomUUID();

        DeviceResponse resp = new DeviceResponse(
                id,
                (String) params.get("name"),
                DeviceType.valueOf((String) params.get("device_type")),
                req.branchId(),
                req.deviceCode(),
                true,
                false,
                null,
                null,
                Instant.now(),
                Instant.now()
        );

        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_DEVICE_CREATED, "Device created successfully", resp);
    }

    // --- SETTINGS ---

    @GET
    @Path("/settings")
    @RequirePermission("attendance:settings:manage")
    public ApiResponse<SettingsDto> getSettings() {
        PluginQueryResult result = client.query("attendance.settings.get", Map.of());
        Map<String, Object> row = result.first();

        SettingsDto dto = new SettingsDto(
                row.get("hanging_threshold_hours") != null ? ((Number) row.get("hanging_threshold_hours")).intValue() : 16,
                row.get("geofence_radius_m") != null ? ((Number) row.get("geofence_radius_m")).intValue() : 200,
                row.get("default_shift_definition_id") != null ? UUID.fromString(row.get("default_shift_definition_id").toString()) : null,
                !Boolean.FALSE.equals(row.get("mobile_require_gps")),
                !Boolean.FALSE.equals(row.get("kiosk_enabled")),
                !Boolean.FALSE.equals(row.get("push_enabled")),
                Map.of(),
                row.get("timezone") != null ? row.get("timezone").toString() : "Asia/Ho_Chi_Minh"
        );

        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_SETTINGS_RETRIEVED, "Settings retrieved", dto);
    }

    private ShiftDto mapShiftRow(Map<String, Object> row) {
        UUID id = row.get("id") != null ? UUID.fromString(row.get("id").toString()) : UUID.randomUUID();
        String code = (String) row.get("code");
        String name = (String) row.get("name");
        UUID catalogId = row.get("catalog_shift_id") != null ? UUID.fromString(row.get("catalog_shift_id").toString()) : null;
        LocalTime start = row.get("start_time") != null ? LocalTime.parse(row.get("start_time").toString()) : LocalTime.of(8, 0);
        LocalTime end = row.get("end_time") != null ? LocalTime.parse(row.get("end_time").toString()) : LocalTime.of(17, 0);
        int graceIn = row.get("grace_in_minutes") != null ? ((Number) row.get("grace_in_minutes")).intValue() : 0;
        int graceOut = row.get("grace_out_minutes") != null ? ((Number) row.get("grace_out_minutes")).intValue() : 0;
        int breakM = row.get("break_minutes") != null ? ((Number) row.get("break_minutes")).intValue() : 0;
        int otGrace = row.get("ot_grace_minutes") != null ? ((Number) row.get("ot_grace_minutes")).intValue() : 0;
        int minOt = row.get("min_ot_minutes") != null ? ((Number) row.get("min_ot_minutes")).intValue() : 15;
        int working = row.get("working_minutes") != null ? ((Number) row.get("working_minutes")).intValue() : 480;
        boolean active = !Boolean.FALSE.equals(row.get("is_active"));

        return new ShiftDto(
                id, code, name, catalogId, start, end, graceIn, graceOut, breakM, otGrace, minOt, working, active,
                Instant.now(), Instant.now()
        );
    }

    private DeviceResponse mapDeviceRow(Map<String, Object> row) {
        UUID id = row.get("id") != null ? UUID.fromString(row.get("id").toString()) : UUID.randomUUID();
        String name = (String) row.get("name");
        DeviceType type = row.get("device_type") != null ? DeviceType.valueOf(row.get("device_type").toString()) : DeviceType.KIOSK;
        UUID branchId = row.get("branch_id") != null ? UUID.fromString(row.get("branch_id").toString()) : null;
        String code = (String) row.get("device_code");
        boolean active = !Boolean.FALSE.equals(row.get("is_active"));
        Instant lockedUntil = row.get("locked_until") != null ? Instant.parse(row.get("locked_until").toString()) : null;
        boolean isLocked = lockedUntil != null && lockedUntil.isAfter(Instant.now());
        Instant secretRotated = row.get("secret_rotated_at") != null ? Instant.parse(row.get("secret_rotated_at").toString()) : null;

        return new DeviceResponse(
                id, name, type, branchId, code, active, isLocked, lockedUntil, secretRotated,
                Instant.now(), Instant.now()
        );
    }
}

