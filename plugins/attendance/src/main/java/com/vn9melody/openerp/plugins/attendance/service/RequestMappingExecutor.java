package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.LeaveTypeDto;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.RequestDto;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import com.vn9melody.openerp.plugins.attendance.model.LogSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@ApplicationScoped
public class RequestMappingExecutor {

    @Inject
    PluginDataClient client;

    @Inject
    LeaveLedgerService leaveLedgerService;

    @Inject
    AttendanceCalculationService calculationService;

    /**
     * Idempotently executes attendance mapping for an APPROVED request.
     * Returns true if mapping succeeded, false otherwise.
     */
    public boolean executeMapping(RequestDto req) {
        String typeCode = req.requestTypeCode();
        UUID empId = req.subjectEmployeeId();
        Map<String, Object> resp = req.response() != null ? req.response() : Map.of();
        Map<String, Object> window = req.affectedWindow() != null ? req.affectedWindow() : Map.of();

        try {
            switch (typeCode) {
                case "LEAVE" -> mapLeaveRequest(req, empId, resp, window);
                case "OVERTIME" -> mapOvertimeRequest(req, empId, resp, window);
                case "ATTENDANCE_FIX" -> mapAttendanceFixRequest(req, empId, resp, window);
                case "LATE_EARLY" -> mapLateEarlyRequest(req, empId, resp, window);
                case "BUSINESS_TRIP" -> mapBusinessTripRequest(req, empId, resp, window);
                case "SHIFT_SWAP" -> mapShiftSwapRequest(req, empId, resp, window);
                default -> {
                    // Custom type X_*: No automated attendance side-effects
                }
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void mapLeaveRequest(RequestDto req, UUID empId, Map<String, Object> resp, Map<String, Object> window) {
        // Resolve leave type
        Object ltIdObj = resp.get("leave_type_id");
        UUID leaveTypeId = null;
        if (ltIdObj != null) {
            leaveTypeId = UUID.fromString(ltIdObj.toString());
        } else {
            List<LeaveTypeDto> all = leaveLedgerService.listLeaveTypes(true);
            if (!all.isEmpty()) leaveTypeId = all.get(0).id();
        }

        double days = parseDouble(resp.get("days"), parseDouble(window.get("days"), 1.0));
        if (leaveTypeId != null) {
            leaveLedgerService.recordUsage(empId, leaveTypeId, days, req.id());
        }

        // Update daily record(s)
        LocalDate startDate = parseLocalDate(resp.get("start_date"), parseLocalDate(window.get("start_date"), LocalDate.now()));
        LocalDate endDate = parseLocalDate(resp.get("end_date"), parseLocalDate(window.get("end_date"), startDate));

        LocalDate curr = startDate;
        while (!curr.isAfter(endDate)) {
            Map<String, Object> recParams = new LinkedHashMap<>();
            recParams.put("employee_id", empId);
            recParams.put("work_date", curr.toString());
            recParams.put("status", days == 0.5 ? AttendanceStatus.HALF_DAY.name() : AttendanceStatus.ON_LEAVE.name());
            recParams.put("is_override", true);
            recParams.put("override_reason", "Đơn nghỉ phép được duyệt: " + req.code());
            client.write("attendance.record.upsert", recParams);
            curr = curr.plusDays(1);
        }
    }

    private void mapOvertimeRequest(RequestDto req, UUID empId, Map<String, Object> resp, Map<String, Object> window) {
        LocalDate workDate = parseLocalDate(resp.get("work_date"), parseLocalDate(window.get("work_date"), LocalDate.now()));
        Instant startAt = parseInstant(resp.get("start_at"), Instant.now());
        Instant endAt = parseInstant(resp.get("end_at"), startAt.plusSeconds(7200));

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", empId);
        params.put("request_id", req.id());
        params.put("work_date", workDate.toString());
        params.put("start_at", startAt.toString());
        params.put("end_at", endAt.toString());
        params.put("status", "ACTIVE");

        client.write("attendance.ot_window.insert", params);
    }

    private void mapAttendanceFixRequest(RequestDto req, UUID empId, Map<String, Object> resp, Map<String, Object> window) {
        LocalDate workDate = parseLocalDate(resp.get("work_date"), parseLocalDate(window.get("work_date"), LocalDate.now()));
        String eventTypeStr = (String) resp.getOrDefault("event_type", "IN");
        LogEventType eventType = "OUT".equalsIgnoreCase(eventTypeStr) ? LogEventType.OUT : LogEventType.IN;
        Instant occurredAt = parseInstant(resp.get("occurred_at"), Instant.now());

        Map<String, Object> logParams = new LinkedHashMap<>();
        logParams.put("employee_id", empId);
        logParams.put("event_type", eventType.name());
        logParams.put("occurred_at", occurredAt.toString());
        logParams.put("work_date", workDate.toString());
        logParams.put("source", LogSource.MANUAL.name());
        logParams.put("meta", Map.of("reason", "Giải trình công được duyệt: " + req.code()));

        client.write("attendance.log.insert", logParams);
    }

    private void mapLateEarlyRequest(RequestDto req, UUID empId, Map<String, Object> resp, Map<String, Object> window) {
        LocalDate workDate = parseLocalDate(resp.get("work_date"), parseLocalDate(window.get("work_date"), LocalDate.now()));
        Map<String, Object> recParams = new LinkedHashMap<>();
        recParams.put("employee_id", empId);
        recParams.put("work_date", workDate.toString());
        recParams.put("status", AttendanceStatus.PRESENT.name());
        recParams.put("late_minutes", 0);
        recParams.put("early_leave_minutes", 0);
        recParams.put("is_override", true);
        recParams.put("override_reason", "Đơn xin đi muộn/về sớm được duyệt: " + req.code());

        client.write("attendance.record.upsert", recParams);
    }

    private void mapBusinessTripRequest(RequestDto req, UUID empId, Map<String, Object> resp, Map<String, Object> window) {
        LocalDate startDate = parseLocalDate(resp.get("start_date"), parseLocalDate(window.get("start_date"), LocalDate.now()));
        LocalDate endDate = parseLocalDate(resp.get("end_date"), parseLocalDate(window.get("end_date"), startDate));

        LocalDate curr = startDate;
        while (!curr.isAfter(endDate)) {
            Map<String, Object> recParams = new LinkedHashMap<>();
            recParams.put("employee_id", empId);
            recParams.put("work_date", curr.toString());
            recParams.put("status", AttendanceStatus.BUSINESS_TRIP.name());
            recParams.put("is_override", true);
            recParams.put("override_reason", "Đi công tác theo đơn được duyệt: " + req.code());
            client.write("attendance.record.upsert", recParams);
            curr = curr.plusDays(1);
        }
    }

    private void mapShiftSwapRequest(RequestDto req, UUID empId, Map<String, Object> resp, Map<String, Object> window) {
        LocalDate workDate = parseLocalDate(resp.get("work_date"), parseLocalDate(window.get("work_date"), LocalDate.now()));
        UUID shiftDefId = resp.get("shift_definition_id") != null ? UUID.fromString(resp.get("shift_definition_id").toString()) : null;

        Map<String, Object> assignParams = new LinkedHashMap<>();
        assignParams.put("employee_id", empId);
        assignParams.put("work_date", workDate.toString());
        assignParams.put("shift_definition_id", shiftDefId);
        assignParams.put("source", "SHIFT_SWAP");
        assignParams.put("reason", "Đổi ca theo đơn: " + req.code());

        client.write("attendance.assignment.insert", assignParams);
    }

    private double parseDouble(Object val, double fallback) {
        if (val == null) return fallback;
        if (val instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(val.toString());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private LocalDate parseLocalDate(Object val, LocalDate fallback) {
        if (val == null) return fallback;
        try {
            return LocalDate.parse(val.toString());
        } catch (Exception e) {
            return fallback;
        }
    }

    private Instant parseInstant(Object val, Instant fallback) {
        if (val == null) return fallback;
        try {
            return Instant.parse(val.toString());
        } catch (Exception e) {
            return fallback;
        }
    }
}

