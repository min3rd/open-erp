package com.vn9melody.openerp.plugins.attendance.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugins.attendance.model.LeaveLedgerEntryType;
import com.vn9melody.openerp.plugins.attendance.model.LeaveLedgerSource;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public final class LeaveDtos {

    private LeaveDtos() {}

    public record LeaveTypeDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("code") String code,
            @JsonProperty("name") String name,
            @JsonProperty("paid") boolean paid,
            @JsonProperty("counts_as_work") boolean countsAsWork,
            @JsonProperty("deduct_balance") boolean deductBalance,
            @JsonProperty("allow_negative") boolean allowNegative,
            @JsonProperty("carry_over_max_days") int carryOverMaxDays,
            @JsonProperty("validity_months") Integer validityMonths,
            @JsonProperty("default_annual_grant") Double defaultAnnualGrant,
            @JsonProperty("is_active") boolean isActive,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record LeaveTypeCreateRequest(
            @JsonProperty("code") String code,
            @JsonProperty("name") String name,
            @JsonProperty("paid") Boolean paid,
            @JsonProperty("counts_as_work") Boolean countsAsWork,
            @JsonProperty("deduct_balance") Boolean deductBalance,
            @JsonProperty("allow_negative") Boolean allowNegative,
            @JsonProperty("carry_over_max_days") Integer carryOverMaxDays,
            @JsonProperty("validity_months") Integer validityMonths,
            @JsonProperty("default_annual_grant") Double defaultAnnualGrant,
            @JsonProperty("is_active") Boolean isActive
    ) {}

    public record LeaveTypeUpdateRequest(
            @JsonProperty("name") String name,
            @JsonProperty("paid") Boolean paid,
            @JsonProperty("counts_as_work") Boolean countsAsWork,
            @JsonProperty("deduct_balance") Boolean deductBalance,
            @JsonProperty("allow_negative") Boolean allowNegative,
            @JsonProperty("carry_over_max_days") Integer carryOverMaxDays,
            @JsonProperty("validity_months") Integer validityMonths,
            @JsonProperty("default_annual_grant") Double defaultAnnualGrant,
            @JsonProperty("is_active") Boolean isActive
    ) {}

    public record LeaveGrantRequest(
            @JsonProperty("employee_ids") List<UUID> employeeIds,
            @JsonProperty("leave_type_id") UUID leaveTypeId,
            @JsonProperty("days") double days,
            @JsonProperty("valid_until") LocalDate validUntil,
            @JsonProperty("note") String note
    ) {}

    public record LeaveAdjustmentRequest(
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("leave_type_id") UUID leaveTypeId,
            @JsonProperty("days") double days,
            @JsonProperty("note") String note
    ) {}

    public record LeaveBalanceDto(
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("leave_type_id") UUID leaveTypeId,
            @JsonProperty("leave_type_code") String leaveTypeCode,
            @JsonProperty("leave_type_name") String leaveTypeName,
            @JsonProperty("granted") double granted,
            @JsonProperty("used") double used,
            @JsonProperty("remaining") double remaining,
            @JsonProperty("expiring") double expiring,
            @JsonProperty("recomputed_at") Instant recomputedAt
    ) {}

    public record LeaveLedgerEntryDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("leave_type_id") UUID leaveTypeId,
            @JsonProperty("entry_type") LeaveLedgerEntryType entryType,
            @JsonProperty("days") double days,
            @JsonProperty("valid_until") LocalDate validUntil,
            @JsonProperty("source_request_id") UUID sourceRequestId,
            @JsonProperty("source") LeaveLedgerSource source,
            @JsonProperty("note") String note,
            @JsonProperty("created_by") UUID createdBy,
            @JsonProperty("created_at") Instant createdAt
    ) {}
}

