package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.LeaveLedgerEntryType;
import com.vn9melody.openerp.plugins.attendance.model.LeaveLedgerSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@ApplicationScoped
public class LeaveLedgerService {

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    // --- LEAVE TYPES ---

    public List<LeaveTypeDto> listLeaveTypes(Boolean isActiveOnly) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (Boolean.TRUE.equals(isActiveOnly)) {
            params.put("is_active", true);
        }
        PluginQueryResult result = client.query("attendance.leave_type.list", params);
        List<LeaveTypeDto> list = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            list.add(mapLeaveTypeRow(row));
        }
        return list;
    }

    public LeaveTypeDto getLeaveType(UUID id) {
        PluginQueryResult result = client.query("attendance.leave_type.get_by_id", Map.of("id", id));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_LEAVE_TYPE_NOT_FOUND,
                    "Leave type not found", Map.of("id", id.toString()));
        }
        return mapLeaveTypeRow(result.rows().get(0));
    }

    public LeaveTypeDto getLeaveTypeByCode(String code) {
        PluginQueryResult result = client.query("attendance.leave_type.get_by_code", Map.of("code", code));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_LEAVE_TYPE_NOT_FOUND,
                    "Leave type not found for code: " + code, Map.of("code", code));
        }
        return mapLeaveTypeRow(result.rows().get(0));
    }

    public LeaveTypeDto createLeaveType(LeaveTypeCreateRequest req) {
        if (req == null || req.code() == null || req.code().isBlank() || req.name() == null || req.name().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Code and Name are required for LeaveType", Map.of());
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("code", req.code().trim().toUpperCase());
        params.put("name", req.name().trim());
        params.put("paid", req.paid() != null ? req.paid() : true);
        params.put("counts_as_work", req.countsAsWork() != null ? req.countsAsWork() : false);
        params.put("deduct_balance", req.deductBalance() != null ? req.deductBalance() : true);
        params.put("allow_negative", req.allowNegative() != null ? req.allowNegative() : false);
        params.put("carry_over_max_days", req.carryOverMaxDays() != null ? req.carryOverMaxDays() : 0);
        params.put("validity_months", req.validityMonths());
        params.put("default_annual_grant", req.defaultAnnualGrant());
        params.put("is_active", req.isActive() != null ? req.isActive() : true);

        PluginQueryResult res = client.write("attendance.leave_type.insert", params);
        UUID id = UUID.fromString(res.rows().get(0).get("id").toString());
        return getLeaveType(id);
    }

    public LeaveTypeDto updateLeaveType(UUID id, LeaveTypeUpdateRequest req) {
        getLeaveType(id); // Ensure exists

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", id);
        if (req.name() != null) params.put("name", req.name().trim());
        if (req.paid() != null) params.put("paid", req.paid());
        if (req.countsAsWork() != null) params.put("counts_as_work", req.countsAsWork());
        if (req.deductBalance() != null) params.put("deduct_balance", req.deductBalance());
        if (req.allowNegative() != null) params.put("allow_negative", req.allowNegative());
        if (req.carryOverMaxDays() != null) params.put("carry_over_max_days", req.carryOverMaxDays());
        if (req.validityMonths() != null) params.put("validity_months", req.validityMonths());
        if (req.defaultAnnualGrant() != null) params.put("default_annual_grant", req.defaultAnnualGrant());
        if (req.isActive() != null) params.put("is_active", req.isActive());
        params.put("updated_at", Instant.now().toString());

        client.write("attendance.leave_type.update", params);
        return getLeaveType(id);
    }

    public void deleteLeaveType(UUID id) {
        getLeaveType(id);
        client.write("attendance.leave_type.delete", Map.of("id", id));
    }

    // --- LEAVE LEDGER & BALANCES ---

    public int grantLeave(UUID createdBy, LeaveGrantRequest req) {
        if (req == null || req.employeeIds() == null || req.employeeIds().isEmpty()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Employee IDs list is required", Map.of());
        }
        if (req.days() <= 0) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Days granted must be greater than zero", Map.of());
        }

        getLeaveType(req.leaveTypeId()); // Ensure type exists

        int count = 0;
        for (UUID empId : req.employeeIds()) {
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("employee_id", empId);
            params.put("leave_type_id", req.leaveTypeId());
            params.put("entry_type", LeaveLedgerEntryType.GRANT.name());
            params.put("days", req.days());
            params.put("valid_until", req.validUntil() != null ? req.validUntil().toString() : null);
            params.put("source", LeaveLedgerSource.HR.name());
            params.put("note", req.note());
            params.put("created_by", createdBy);

            client.write("attendance.leave_ledger.insert", params);
            deriveBalance(empId, req.leaveTypeId()); // Sync snapshot
            count++;
        }
        return count;
    }

    public LeaveBalanceDto adjustLeave(UUID createdBy, LeaveAdjustmentRequest req) {
        if (req == null || req.employeeId() == null || req.leaveTypeId() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Employee ID and Leave Type ID are required", Map.of());
        }
        if (req.note() == null || req.note().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Adjustment reason/note is required", Map.of());
        }

        getLeaveType(req.leaveTypeId());

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", req.employeeId());
        params.put("leave_type_id", req.leaveTypeId());
        params.put("entry_type", LeaveLedgerEntryType.ADJUSTMENT.name());
        params.put("days", req.days());
        params.put("source", LeaveLedgerSource.HR.name());
        params.put("note", req.note().trim());
        params.put("created_by", createdBy);

        client.write("attendance.leave_ledger.insert", params);
        return deriveBalance(req.employeeId(), req.leaveTypeId());
    }

    public void recordUsage(UUID employeeId, UUID leaveTypeId, double days, UUID sourceRequestId) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", employeeId);
        params.put("leave_type_id", leaveTypeId);
        params.put("entry_type", LeaveLedgerEntryType.USAGE.name());
        params.put("days", -Math.abs(days));
        params.put("source_request_id", sourceRequestId);
        params.put("source", LeaveLedgerSource.REQUEST.name());
        params.put("note", "Khấu trừ theo đơn nghỉ phép");

        client.write("attendance.leave_ledger.insert", params);
        deriveBalance(employeeId, leaveTypeId);
    }

    public void reverseUsage(UUID employeeId, UUID leaveTypeId, double days, UUID sourceRequestId) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", employeeId);
        params.put("leave_type_id", leaveTypeId);
        params.put("entry_type", LeaveLedgerEntryType.USAGE_REVERSAL.name());
        params.put("days", Math.abs(days));
        params.put("source_request_id", sourceRequestId);
        params.put("source", LeaveLedgerSource.REQUEST.name());
        params.put("note", "Hoàn trả phép do hủy đơn");

        client.write("attendance.leave_ledger.insert", params);
        deriveBalance(employeeId, leaveTypeId);
    }

    public LeaveBalanceDto deriveBalance(UUID employeeId, UUID leaveTypeId) {
        LeaveTypeDto lt = getLeaveType(leaveTypeId);

        PluginQueryResult entries = client.query("attendance.leave_ledger.list", Map.of(
                "employee_id", employeeId,
                "leave_type_id", leaveTypeId
        ));

        double granted = 0;
        double used = 0;
        double adjustments = 0;
        double expired = 0;
        double expiringThisMonth = 0;

        LocalDate today = LocalDate.now();
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        for (Map<String, Object> row : entries.rows()) {
            LeaveLedgerEntryType type = LeaveLedgerEntryType.valueOf(row.get("entry_type").toString());
            double days = ((Number) row.get("days")).doubleValue();
            LocalDate validUntil = row.get("valid_until") != null ? LocalDate.parse(row.get("valid_until").toString()) : null;

            switch (type) {
                case GRANT -> {
                    granted += days;
                    if (validUntil != null && validUntil.isAfter(today) && !validUntil.isAfter(endOfMonth)) {
                        expiringThisMonth += days;
                    }
                }
                case USAGE -> used += Math.abs(days);
                case USAGE_REVERSAL -> used -= days;
                case ADJUSTMENT -> adjustments += days;
                case EXPIRY -> expired += Math.abs(days);
            }
        }

        double remaining = granted - used + adjustments - expired;

        // Upsert into snapshot cache
        Map<String, Object> snapParams = new LinkedHashMap<>();
        snapParams.put("employee_id", employeeId);
        snapParams.put("leave_type_id", leaveTypeId);
        snapParams.put("granted", granted);
        snapParams.put("used", used);
        snapParams.put("remaining", remaining);
        snapParams.put("expiring", expiringThisMonth);
        snapParams.put("recomputed_at", Instant.now().toString());

        try {
            client.write("attendance.leave_balance.upsert", snapParams);
        } catch (Exception ignored) {}

        return new LeaveBalanceDto(
                employeeId, leaveTypeId, lt.code(), lt.name(),
                granted, used, remaining, expiringThisMonth, Instant.now()
        );
    }

    public List<LeaveBalanceDto> getMyLeaveBalances(UUID employeeId) {
        List<LeaveTypeDto> activeTypes = listLeaveTypes(true);
        List<LeaveBalanceDto> balances = new ArrayList<>();
        for (LeaveTypeDto lt : activeTypes) {
            balances.add(deriveBalance(employeeId, lt.id()));
        }
        return balances;
    }

    public PagedData<LeaveBalanceDto> getAdminLeaveBalances(UUID employeeId, UUID leaveTypeId, int page, int size) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (employeeId != null) params.put("employee_id", employeeId);
        if (leaveTypeId != null) params.put("leave_type_id", leaveTypeId);
        params.put("page", page > 0 ? page : 1);
        params.put("size", size > 0 ? size : 50);

        PluginQueryResult result = client.query("attendance.leave_balance.list", params);
        List<LeaveBalanceDto> list = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            UUID empId = UUID.fromString(row.get("employee_id").toString());
            UUID ltId = UUID.fromString(row.get("leave_type_id").toString());
            list.add(deriveBalance(empId, ltId));
        }
        long total = result.totalRows() > 0 ? result.totalRows() : list.size();
        return PagedData.of(list, page > 0 ? page : 1, size > 0 ? size : 50, total);
    }

    public PagedData<LeaveLedgerEntryDto> listLedgerEntries(UUID employeeId, UUID leaveTypeId, String entryType, int page, int size) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (employeeId != null) params.put("employee_id", employeeId);
        if (leaveTypeId != null) params.put("leave_type_id", leaveTypeId);
        if (entryType != null && !entryType.isBlank()) params.put("entry_type", entryType);
        params.put("page", page > 0 ? page : 1);
        params.put("size", size > 0 ? size : 50);

        PluginQueryResult result = client.query("attendance.leave_ledger.list", params);
        List<LeaveLedgerEntryDto> list = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            list.add(mapLedgerRow(row));
        }
        long total = result.totalRows() > 0 ? result.totalRows() : list.size();
        return PagedData.of(list, page > 0 ? page : 1, size > 0 ? size : 50, total);
    }

    public int runDailyExpiryJob() {
        // Find grants where valid_until < today
        LocalDate today = LocalDate.now();
        PluginQueryResult entries = client.query("attendance.leave_ledger.list", Map.of(
                "entry_type", LeaveLedgerEntryType.GRANT.name()
        ));

        int expiredCount = 0;
        for (Map<String, Object> row : entries.rows()) {
            if (row.get("valid_until") == null) continue;
            LocalDate validUntil = LocalDate.parse(row.get("valid_until").toString());
            if (validUntil.isBefore(today)) {
                UUID empId = UUID.fromString(row.get("employee_id").toString());
                UUID ltId = UUID.fromString(row.get("leave_type_id").toString());
                LeaveBalanceDto bal = deriveBalance(empId, ltId);
                if (bal.remaining() > 0) {
                    Map<String, Object> expParams = new LinkedHashMap<>();
                    expParams.put("employee_id", empId);
                    expParams.put("leave_type_id", ltId);
                    expParams.put("entry_type", LeaveLedgerEntryType.EXPIRY.name());
                    expParams.put("days", -bal.remaining());
                    expParams.put("source", LeaveLedgerSource.JOB.name());
                    expParams.put("note", "Hết hạn ngày phép theo quy định");
                    client.write("attendance.leave_ledger.insert", expParams);
                    deriveBalance(empId, ltId);
                    expiredCount++;
                }
            }
        }
        return expiredCount;
    }

    private LeaveTypeDto mapLeaveTypeRow(Map<String, Object> row) {
        UUID id = UUID.fromString(row.get("id").toString());
        String code = (String) row.get("code");
        String name = (String) row.get("name");
        boolean paid = Boolean.TRUE.equals(row.get("paid"));
        boolean countsAsWork = Boolean.TRUE.equals(row.get("counts_as_work"));
        boolean deductBalance = Boolean.TRUE.equals(row.get("deduct_balance"));
        boolean allowNegative = Boolean.TRUE.equals(row.get("allow_negative"));
        int carryOver = row.get("carry_over_max_days") != null ? ((Number) row.get("carry_over_max_days")).intValue() : 0;
        Integer validity = row.get("validity_months") != null ? ((Number) row.get("validity_months")).intValue() : null;
        Double annualGrant = row.get("default_annual_grant") != null ? ((Number) row.get("default_annual_grant")).doubleValue() : null;
        boolean isActive = Boolean.TRUE.equals(row.get("is_active"));
        Instant createdAt = row.get("created_at") != null ? Instant.parse(row.get("created_at").toString()) : Instant.now();
        Instant updatedAt = row.get("updated_at") != null ? Instant.parse(row.get("updated_at").toString()) : Instant.now();

        return new LeaveTypeDto(id, code, name, paid, countsAsWork, deductBalance, allowNegative, carryOver, validity, annualGrant, isActive, createdAt, updatedAt);
    }

    private LeaveLedgerEntryDto mapLedgerRow(Map<String, Object> row) {
        UUID id = UUID.fromString(row.get("id").toString());
        UUID empId = UUID.fromString(row.get("employee_id").toString());
        UUID ltId = UUID.fromString(row.get("leave_type_id").toString());
        LeaveLedgerEntryType type = LeaveLedgerEntryType.valueOf(row.get("entry_type").toString());
        double days = ((Number) row.get("days")).doubleValue();
        LocalDate validUntil = row.get("valid_until") != null ? LocalDate.parse(row.get("valid_until").toString()) : null;
        UUID reqId = row.get("source_request_id") != null ? UUID.fromString(row.get("source_request_id").toString()) : null;
        LeaveLedgerSource src = row.get("source") != null ? LeaveLedgerSource.valueOf(row.get("source").toString()) : LeaveLedgerSource.HR;
        String note = (String) row.get("note");
        UUID createdBy = row.get("created_by") != null ? UUID.fromString(row.get("created_by").toString()) : null;
        Instant createdAt = row.get("created_at") != null ? Instant.parse(row.get("created_at").toString()) : Instant.now();

        return new LeaveLedgerEntryDto(id, empId, ltId, type, days, validUntil, reqId, src, note, createdBy, createdAt);
    }
}
