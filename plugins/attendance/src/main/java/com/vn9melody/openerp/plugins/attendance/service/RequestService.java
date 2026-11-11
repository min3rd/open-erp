package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.LeaveBalanceDto;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.LeaveTypeDto;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.ApprovalMode;
import com.vn9melody.openerp.plugins.attendance.model.MappingStatus;
import com.vn9melody.openerp.plugins.attendance.model.RequestStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@ApplicationScoped
public class RequestService {

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    @Inject
    RequestTypeService requestTypeService;

    @Inject
    LeaveLedgerService leaveLedgerService;

    @Inject
    RequestMappingExecutor mappingExecutor;

    @Inject
    ObjectMapper objectMapper;

    public RequestDto submitRequest(UUID subjectEmployeeId, UUID currentUserId, RequestSubmitRequest req) {
        if (req == null || req.requestTypeCode() == null || req.requestTypeCode().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Request type code is required", Map.of());
        }

        RequestTypeDto type = requestTypeService.getRequestTypeByCode(req.requestTypeCode());
        if (!type.isActive()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Request type is currently disabled", Map.of("code", type.code()));
        }

        Map<String, Object> resp = req.response() != null ? req.response() : Map.of();
        Map<String, Object> window = req.affectedWindow() != null ? req.affectedWindow() : Map.of();

        // Check window days (AC-R01): date cannot be older than window_days from today
        LocalDate targetDate = extractTargetDate(resp, window);
        LocalDate minAllowedDate = LocalDate.now().minusDays(type.windowDays());
        if (targetDate.isBefore(minAllowedDate)) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_REQUEST_WINDOW_EXCEEDED,
                    "Submission date exceeds allowed window of " + type.windowDays() + " days",
                    Map.of("target_date", targetDate.toString(), "min_allowed", minAllowedDate.toString()));
        }

        // Check if timesheet for that period is locked (AC-Đ06)
        checkPeriodNotLocked(targetDate);

        // Leave balance check for LEAVE request
        if ("LEAVE".equalsIgnoreCase(type.code())) {
            validateLeaveBalance(subjectEmployeeId, resp, window);
        }

        String requestCode = generateRequestCode();

        Map<String, Object> insertParams = new LinkedHashMap<>();
        insertParams.put("request_type_id", type.id());
        insertParams.put("code", requestCode);
        insertParams.put("subject_employee_id", subjectEmployeeId);
        insertParams.put("submitted_by_user_id", currentUserId);
        insertParams.put("form_version", 1);
        insertParams.put("response", serializeJson(resp));
        insertParams.put("status", RequestStatus.PENDING.name());
        insertParams.put("approval_mode", ApprovalMode.INTERNAL_FALLBACK.name());
        insertParams.put("affected_window", serializeJson(window));
        insertParams.put("mapping_status", MappingStatus.PENDING.name());

        PluginQueryResult res = client.write("attendance.request.insert", insertParams);
        UUID id = UUID.fromString(res.rows().get(0).get("id").toString());

        // Publish outbox event
        publishRequestCreatedEvent(id, requestCode, type.code(), subjectEmployeeId);

        return getRequest(id);
    }

    public RequestDto fallbackAction(UUID requestId, UUID currentUserId, FallbackActionRequest req) {
        RequestDto existing = getRequest(requestId);
        if (existing.status() != RequestStatus.PENDING) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_REQUEST_NOT_ACTIONABLE,
                    "Request is not in PENDING state", Map.of("current_status", existing.status().name()));
        }
        if (existing.approvalMode() != ApprovalMode.INTERNAL_FALLBACK) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_REQUEST_NOT_ACTIONABLE,
                    "Request is managed by workflow engine, not internal fallback", Map.of());
        }
        if (req == null || req.action() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Action (APPROVE or REJECT) is required", Map.of());
        }

        RequestStatus newStatus = req.action();
        MappingStatus mappingStatus = existing.mappingStatus();
        String mappingError = null;

        if (newStatus == RequestStatus.APPROVED) {
            boolean success = mappingExecutor.executeMapping(existing);
            mappingStatus = success ? MappingStatus.APPLIED : MappingStatus.FAILED;
            if (!success) mappingError = "Attendance mapping execution failed";
        }

        Map<String, Object> updateParams = new LinkedHashMap<>();
        updateParams.put("id", requestId);
        updateParams.put("status", newStatus.name());
        updateParams.put("fallback_approver_employee_id", currentUserId);
        updateParams.put("fallback_comment", req.comment());
        updateParams.put("mapping_status", mappingStatus.name());
        updateParams.put("mapping_error", mappingError);
        updateParams.put("updated_at", Instant.now().toString());

        client.write("attendance.request.update_status", updateParams);
        return getRequest(requestId);
    }

    public void handleWorkflowCompletedEvent(UUID requestId, String outcome, String comment) {
        RequestDto existing = getRequest(requestId);
        if (existing.status() != RequestStatus.PENDING) {
            return; // Idempotent: already processed
        }

        boolean approved = "APPROVED".equalsIgnoreCase(outcome);
        RequestStatus newStatus = approved ? RequestStatus.APPROVED : RequestStatus.REJECTED;
        MappingStatus mappingStatus = existing.mappingStatus();
        String mappingError = null;

        if (approved) {
            boolean success = mappingExecutor.executeMapping(existing);
            mappingStatus = success ? MappingStatus.APPLIED : MappingStatus.FAILED;
            if (!success) mappingError = "Attendance mapping failed during workflow complete";
        }

        Map<String, Object> updateParams = new LinkedHashMap<>();
        updateParams.put("id", requestId);
        updateParams.put("status", newStatus.name());
        updateParams.put("fallback_comment", comment);
        updateParams.put("mapping_status", mappingStatus.name());
        updateParams.put("mapping_error", mappingError);
        updateParams.put("updated_at", Instant.now().toString());

        client.write("attendance.request.update_status", updateParams);
    }

    public RequestDto getRequest(UUID id) {
        PluginQueryResult result = client.query("attendance.request.get_by_id", Map.of("id", id));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_REQUEST_NOT_FOUND,
                    "Request not found", Map.of("id", id.toString()));
        }
        return mapRequestRow(result.rows().get(0));
    }

    public PagedData<RequestDto> getMyRequests(UUID employeeId, String status, String typeCode, int page, int size) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("subject_employee_id", employeeId);
        if (status != null && !status.isBlank()) params.put("status", status);
        params.put("page", page > 0 ? page : 1);
        params.put("size", size > 0 ? size : 20);

        PluginQueryResult result = client.query("attendance.request.list", params);
        List<RequestDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapRequestRow(row));
        }
        long total = result.totalRows() > 0 ? result.totalRows() : items.size();
        return PagedData.of(items, page > 0 ? page : 1, size > 0 ? size : 20, total);
    }

    public PagedData<RequestDto> getInboxRequests(UUID approverEmployeeId, int page, int size) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("status", RequestStatus.PENDING.name());
        params.put("page", page > 0 ? page : 1);
        params.put("size", size > 0 ? size : 20);

        PluginQueryResult result = client.query("attendance.request.list", params);
        List<RequestDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapRequestRow(row));
        }
        long total = result.totalRows() > 0 ? result.totalRows() : items.size();
        return PagedData.of(items, page > 0 ? page : 1, size > 0 ? size : 20, total);
    }

    private void validateLeaveBalance(UUID employeeId, Map<String, Object> resp, Map<String, Object> window) {
        Object ltIdObj = resp.get("leave_type_id");
        if (ltIdObj == null) return;
        UUID leaveTypeId = UUID.fromString(ltIdObj.toString());
        LeaveTypeDto lt = leaveLedgerService.getLeaveType(leaveTypeId);

        if (!lt.deductBalance() || lt.allowNegative()) {
            return;
        }

        double requestedDays = parseDouble(resp.get("days"), parseDouble(window.get("days"), 1.0));
        LeaveBalanceDto balance = leaveLedgerService.deriveBalance(employeeId, leaveTypeId);
        if (balance.remaining() < requestedDays) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_INSUFFICIENT_LEAVE_BALANCE,
                    "Insufficient leave balance: requested " + requestedDays + ", remaining " + balance.remaining(),
                    Map.of("requested", requestedDays, "remaining", balance.remaining()));
        }
    }

    private void checkPeriodNotLocked(LocalDate targetDate) {
        int year = targetDate.getYear();
        int month = targetDate.getMonthValue();
        PluginQueryResult tsResult = client.query("attendance.timesheet.get_by_period", Map.of(
                "scope_type", "TENANT",
                "period_year", year,
                "period_month", month
        ));
        if (!tsResult.rows().isEmpty()) {
            Map<String, Object> row = tsResult.rows().get(0);
            if (row.get("locked_at") != null) {
                throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_PERIOD_LOCKED,
                        "Attendance period " + month + "/" + year + " is already locked",
                        Map.of("period_year", year, "period_month", month));
            }
        }
    }

    private LocalDate extractTargetDate(Map<String, Object> resp, Map<String, Object> window) {
        if (resp.get("work_date") != null) {
            return LocalDate.parse(resp.get("work_date").toString());
        }
        if (resp.get("start_date") != null) {
            return LocalDate.parse(resp.get("start_date").toString());
        }
        if (window.get("start_date") != null) {
            return LocalDate.parse(window.get("start_date").toString());
        }
        if (window.get("work_date") != null) {
            return LocalDate.parse(window.get("work_date").toString());
        }
        return LocalDate.now();
    }

    private String generateRequestCode() {
        LocalDate now = LocalDate.now();
        String prefix = String.format("REQ-%d%02d-", now.getYear(), now.getMonthValue());
        int randomSuffix = 1000 + new Random().nextInt(9000);
        return prefix + randomSuffix;
    }

    private void publishRequestCreatedEvent(UUID requestId, String code, String typeCode, UUID employeeId) {
        Map<String, Object> payload = Map.of(
                "request_id", requestId.toString(),
                "code", code,
                "type_code", typeCode,
                "employee_id", employeeId.toString()
        );
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("event_type", "attendance.request.created");
        params.put("aggregate_id", requestId);
        params.put("payload", serializeJson(payload));
        params.put("status", "PENDING");
        try {
            client.write("attendance.outbox.insert", params);
        } catch (Exception ignored) {}
    }

    private RequestDto mapRequestRow(Map<String, Object> row) {
        UUID id = UUID.fromString(row.get("id").toString());
        UUID typeId = UUID.fromString(row.get("request_type_id").toString());
        String code = (String) row.get("code");
        UUID subjectEmpId = UUID.fromString(row.get("subject_employee_id").toString());
        UUID submittedUserId = UUID.fromString(row.get("submitted_by_user_id").toString());
        Integer formVersion = row.get("form_version") != null ? ((Number) row.get("form_version")).intValue() : null;
        Map<String, Object> resp = parseJson(row.get("response"));
        RequestStatus status = RequestStatus.valueOf(row.get("status").toString());
        UUID wfInstanceId = row.get("workflow_instance_id") != null ? UUID.fromString(row.get("workflow_instance_id").toString()) : null;
        ApprovalMode approvalMode = row.get("approval_mode") != null ? ApprovalMode.valueOf(row.get("approval_mode").toString()) : ApprovalMode.INTERNAL_FALLBACK;
        UUID fallbackApprover = row.get("fallback_approver_employee_id") != null ? UUID.fromString(row.get("fallback_approver_employee_id").toString()) : null;
        String fallbackComment = (String) row.get("fallback_comment");
        Map<String, Object> affectedWindow = parseJson(row.get("affected_window"));
        MappingStatus mappingStatus = row.get("mapping_status") != null ? MappingStatus.valueOf(row.get("mapping_status").toString()) : MappingStatus.NOT_APPLICABLE;
        String mappingError = (String) row.get("mapping_error");
        Instant createdAt = row.get("created_at") != null ? Instant.parse(row.get("created_at").toString()) : Instant.now();
        Instant updatedAt = row.get("updated_at") != null ? Instant.parse(row.get("updated_at").toString()) : Instant.now();

        // Resolve request type name and code
        String typeCode = "";
        String typeName = "";
        try {
            RequestTypeDto rt = requestTypeService.getRequestType(typeId);
            typeCode = rt.code();
            typeName = rt.name();
        } catch (Exception ignored) {}

        return new RequestDto(
                id, code, typeId, typeCode, typeName, subjectEmpId, "",
                submittedUserId, formVersion, resp, status, wfInstanceId,
                approvalMode, fallbackApprover, fallbackComment, affectedWindow,
                mappingStatus, mappingError, createdAt, updatedAt
        );
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

    private Map<String, Object> parseJson(Object val) {
        if (val == null) return Map.of();
        if (val instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> m = (Map<String, Object>) val;
            return m;
        }
        try {
            return objectMapper.readValue(val.toString(), new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private String serializeJson(Object val) {
        if (val == null) return null;
        try {
            return objectMapper.writeValueAsString(val);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}

