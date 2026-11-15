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
import com.vn9melody.openerp.plugins.attendance.service.AttendanceAuditService;
import com.vn9melody.openerp.plugins.attendance.service.KioskSecurityService;
import com.vn9melody.openerp.plugins.attendance.service.OrgDirectoryService;
import com.vn9melody.openerp.plugins.attendance.service.PluginDataPager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
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

    @Inject
    AttendanceAuditService auditService;

    @Inject
    OrgDirectoryService orgDirectory;

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
        params.put("page", page > 0 ? page - 1 : 0);
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

    @GET
    @Path("/shift-coverage")
    @RequirePermission("attendance:shift:manage")
    public ApiResponse<ListData<ShiftCoverageDto>> shiftCoverage(
            @QueryParam("month") String monthStr
    ) {
        java.time.YearMonth month;
        try {
            month = monthStr != null && !monthStr.isBlank()
                    ? java.time.YearMonth.parse(monthStr) : java.time.YearMonth.now();
        } catch (RuntimeException e) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "month must use yyyy-MM", Map.of());
        }
        LocalDate from = month.atDay(1);
        LocalDate to = month.atEndOfMonth();

        Map<UUID, Set<UUID>> employeesByShift = new LinkedHashMap<>();
        for (Map<String, Object> shift : PluginDataPager.listAll(client, "attendance.shift.list",
                Map.of(), 100)) {
            if (shift.get("id") != null) {
                employeesByShift.put(UUID.fromString(shift.get("id").toString()), new LinkedHashSet<>());
            }
        }
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.assignment.list_by_date",
                    Map.of("work_date", date.toString()), 500)) {
                if (row.get("shift_definition_id") == null || row.get("employee_id") == null) {
                    continue;
                }
                UUID shiftId = UUID.fromString(row.get("shift_definition_id").toString());
                UUID employeeId = UUID.fromString(row.get("employee_id").toString());
                employeesByShift.computeIfAbsent(shiftId, key -> new LinkedHashSet<>()).add(employeeId);
            }
        }

        Map<UUID, OrgDirectoryService.EmployeeOrg> org = orgDirectory.employeeOrg();
        List<ShiftCoverageDto> items = new ArrayList<>();
        employeesByShift.forEach((shiftId, employeeIds) -> {
            Set<String> departments = new TreeSet<>();
            Set<String> branches = new TreeSet<>();
            for (UUID employeeId : employeeIds) {
                OrgDirectoryService.EmployeeOrg employeeOrg = org.get(employeeId);
                if (employeeOrg == null) {
                    continue;
                }
                if (employeeOrg.departmentName() != null) {
                    departments.add(employeeOrg.departmentName());
                }
                if (employeeOrg.branchName() != null) {
                    branches.add(employeeOrg.branchName());
                }
            }
            items.add(new ShiftCoverageDto(
                    shiftId,
                    employeeIds.size(),
                    new ArrayList<>(departments),
                    new ArrayList<>(branches)));
        });
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_SHIFT_LIST_SUCCESS,
                "Shift coverage retrieved",
                items
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

    @POST
    @Path("/shift-assignments/bulk")
    @RequirePermission("attendance:shift:manage")
    public ApiResponse<Map<String, Object>> bulkAssignShifts(BulkShiftAssignRequest req) {
        if (req == null || req.shiftDefinitionId() == null || req.from() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "shift_definition_id and from are required", Map.of());
        }
        LocalDate from = req.from();
        LocalDate to = req.to() != null ? req.to() : from;
        if (to.isBefore(from)) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "to must be on or after from", Map.of());
        }
        // Keep each call under the 30s plugin gateway timeout; the UI sends weekly chunks.
        if (ChronoUnit.DAYS.between(from, to) > 10) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Range must not exceed 10 days per call", Map.of());
        }

        List<Map<String, Object>> shifts = PluginDataPager.listAll(client, "attendance.shift.list",
                Map.of("is_active", true), 100);
        boolean shiftExists = shifts.stream()
                .anyMatch(row -> req.shiftDefinitionId().toString().equals(String.valueOf(row.get("id"))));
        if (!shiftExists) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_SHIFT_NOT_FOUND,
                    "Shift definition not found", Map.of("id", req.shiftDefinitionId().toString()));
        }

        List<Map<String, Object>> employees = PluginDataPager.listAll(client,
                "attendance.employee_ref.list_all", Map.of(), 500);
        UUID currentUserId = tenantContext.userId();
        Set<UUID> requestedEmployeeIds = req.employeeIds() != null
                ? new LinkedHashSet<>(req.employeeIds()) : Set.of();

        int assigned = 0;
        int skipped = 0;
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            // ponytail: weekend is treated as non-working; a work-week setting would refine this.
            if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }
            Set<String> assignedEmployeeIds = new HashSet<>();
            for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.assignment.list_by_date",
                    Map.of("work_date", date.toString()), 500)) {
                if (row.get("employee_id") != null) {
                    assignedEmployeeIds.add(row.get("employee_id").toString());
                }
            }
            for (Map<String, Object> emp : employees) {
                if (emp.get("employee_id") == null) {
                    continue;
                }
                if (!"ACTIVE".equalsIgnoreCase(String.valueOf(emp.get("employment_status")))) {
                    continue;
                }
                String employeeId = emp.get("employee_id").toString();
                if (!requestedEmployeeIds.isEmpty()
                        && !requestedEmployeeIds.contains(UUID.fromString(employeeId))) {
                    continue;
                }
                if (assignedEmployeeIds.contains(employeeId)) {
                    skipped++;
                    continue;
                }
                Map<String, Object> params = new LinkedHashMap<>();
                params.put("employee_id", employeeId);
                params.put("work_date", date.toString());
                params.put("shift_definition_id", req.shiftDefinitionId());
                params.put("source", "HR");
                params.put("reason", "Bulk assign " + date.getYear() + "-" + date.getMonthValue());
                params.put("created_by", currentUserId);
                client.write("attendance.assignment.insert", params);
                assigned++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("assigned", assigned);
        result.put("skipped", skipped);
        result.put("from", from.toString());
        result.put("to", to.toString());

        auditService.record("SHIFT_BULK_ASSIGN", "ShiftAssignment", null,
                Map.of("shift_definition_id", req.shiftDefinitionId().toString(),
                        "from", from.toString(), "to", to.toString(),
                        "assigned", assigned, "skipped", skipped));

        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_ASSIGNMENT_CREATED,
                "Shift assignments created", result);
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
        params.put("page", page > 0 ? page - 1 : 0);
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
        String deviceToken = req.ingestSecret() != null && !req.ingestSecret().isBlank()
                ? req.ingestSecret().trim()
                : UUID.randomUUID().toString().replace("-", "");
        String deviceTokenHash = securityService.hashPin(deviceToken);

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("name", req.name() != null ? req.name().trim() : req.deviceCode());
        params.put("device_type", req.deviceType() != null ? req.deviceType().name() : DeviceType.KIOSK.name());
        params.put("branch_id", req.branchId());
        params.put("device_code", req.deviceCode().trim());
        params.put("pin_hash", pinHash);
        params.put("ingest_secret_hash", deviceTokenHash);
        params.put("is_active", true);
        params.put("public_token", deviceToken);

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
                Instant.now(),
                Instant.now(),
                Instant.now(),
                deviceToken,
                deviceToken
        );

        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_DEVICE_CREATED, "Device created successfully", resp);
    }

    @POST
    @Path("/devices/{id}/rotate")
    @RequirePermission("attendance:settings:manage")
    public ApiResponse<DeviceResponse> rotateDeviceToken(@PathParam("id") UUID id) {
        PluginQueryResult result = client.query("attendance.device.list", Map.of("page", 0, "size", 100));
        Map<String, Object> row = result.rows().stream()
                .filter(item -> item.get("id") != null && id.toString().equals(item.get("id").toString()))
                .findFirst().orElse(null);
        if (row == null) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_DEVICE_NOT_FOUND,
                    "Device not found", Map.of("id", id.toString()));
        }
        String deviceToken = UUID.randomUUID().toString().replace("-", "");
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", id);
        params.put("ingest_secret_hash", securityService.hashPin(deviceToken));
        params.put("public_token", deviceToken);
        params.put("secret_rotated_at", Instant.now());
        client.write("attendance.device.set_public_token", params);

        UUID branchId = row.get("branch_id") != null ? UUID.fromString(row.get("branch_id").toString()) : null;
        DeviceResponse resp = new DeviceResponse(
                id,
                (String) row.get("name"),
                DeviceType.valueOf((String) row.get("device_type")),
                branchId,
                (String) row.get("device_code"),
                !Boolean.FALSE.equals(row.get("is_active")),
                false,
                null,
                Instant.now(),
                Instant.now(),
                Instant.now(),
                deviceToken,
                deviceToken
        );
        return ApiResponse.success(AttendanceErrorCode.ATTENDANCE_DEVICE_CREATED,
                "Device token rotated", resp);
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
        String publicToken = row.get("public_token") != null ? row.get("public_token").toString() : null;

        return new DeviceResponse(
                id, name, type, branchId, code, active, isLocked, lockedUntil, secretRotated,
                Instant.now(), Instant.now(), null, publicToken
        );
    }
}

