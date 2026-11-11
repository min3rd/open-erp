package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.*;
import com.vn9melody.openerp.plugins.attendance.service.LeaveLedgerService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class LeaveAdminResource {

    @Inject
    LeaveLedgerService leaveLedgerService;

    @Inject
    TenantContext tenantContext;

    // --- LEAVE TYPES ---

    @GET
    @Path("/admin/leave-types")
    @RequirePermission("attendance:leave:manage")
    public ApiResponse<ListData<LeaveTypeDto>> listLeaveTypes(@QueryParam("active_only") Boolean activeOnly) {
        List<LeaveTypeDto> list = leaveLedgerService.listLeaveTypes(activeOnly);
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_LEAVE_TYPE_LIST_SUCCESS,
                "Leave types retrieved",
                list
        );
    }

    @POST
    @Path("/admin/leave-types")
    @RequirePermission("attendance:leave:manage")
    public ApiResponse<LeaveTypeDto> createLeaveType(LeaveTypeCreateRequest request) {
        LeaveTypeDto created = leaveLedgerService.createLeaveType(request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_LEAVE_TYPE_CREATED,
                "Leave type created successfully",
                created
        );
    }

    @PUT
    @Path("/admin/leave-types/{id}")
    @RequirePermission("attendance:leave:manage")
    public ApiResponse<LeaveTypeDto> updateLeaveType(
            @PathParam("id") UUID id,
            LeaveTypeUpdateRequest request
    ) {
        LeaveTypeDto updated = leaveLedgerService.updateLeaveType(id, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_LEAVE_TYPE_UPDATED,
                "Leave type updated successfully",
                updated
        );
    }

    @DELETE
    @Path("/admin/leave-types/{id}")
    @RequirePermission("attendance:leave:manage")
    public ApiResponse<Map<String, Object>> deleteLeaveType(@PathParam("id") UUID id) {
        leaveLedgerService.deleteLeaveType(id);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_LEAVE_TYPE_DELETED,
                "Leave type deleted successfully",
                Map.of("id", id)
        );
    }

    // --- GRANTS & ADJUSTMENTS ---

    @POST
    @Path("/admin/leave-ledger/grants")
    @RequirePermission("attendance:leave:manage")
    public ApiResponse<Map<String, Object>> grantLeave(LeaveGrantRequest request) {
        UUID currentUserId = tenantContext.userId();
        int count = leaveLedgerService.grantLeave(currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_GRANT_SUCCESS,
                "Leave granted successfully",
                Map.of("granted_count", count)
        );
    }

    @POST
    @Path("/admin/leave-ledger/adjustments")
    @RequirePermission("attendance:leave:manage")
    public ApiResponse<LeaveBalanceDto> adjustLeave(LeaveAdjustmentRequest request) {
        UUID currentUserId = tenantContext.userId();
        LeaveBalanceDto balance = leaveLedgerService.adjustLeave(currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_ADJUSTMENT_SUCCESS,
                "Leave balance adjusted successfully",
                balance
        );
    }

    // --- BALANCES & LEDGER ---

    @GET
    @Path("/my-leave-balances")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<ListData<LeaveBalanceDto>> getMyLeaveBalances() {
        UUID currentUserId = tenantContext.userId();
        List<LeaveBalanceDto> list = leaveLedgerService.getMyLeaveBalances(currentUserId);
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_BALANCE_LIST_SUCCESS,
                "My leave balances retrieved",
                list
        );
    }

    @GET
    @Path("/admin/leave-balances")
    @RequirePermission("attendance:leave:manage")
    public ApiResponse<PagedData<LeaveBalanceDto>> getAdminLeaveBalances(
            @QueryParam("employee_id") String empIdStr,
            @QueryParam("leave_type_id") String ltIdStr,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("50") int size
    ) {
        UUID empId = (empIdStr != null && !empIdStr.isBlank()) ? UUID.fromString(empIdStr) : null;
        UUID ltId = (ltIdStr != null && !ltIdStr.isBlank()) ? UUID.fromString(ltIdStr) : null;
        PagedData<LeaveBalanceDto> paged = leaveLedgerService.getAdminLeaveBalances(empId, ltId, page, size);
        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_BALANCE_LIST_SUCCESS,
                "Leave balances retrieved",
                paged.getItems(),
                paged.getPage(),
                paged.getSize(),
                paged.getTotalItems()
        );
    }

    @GET
    @Path("/admin/leave-ledger")
    @RequirePermission("attendance:leave:manage")
    public ApiResponse<PagedData<LeaveLedgerEntryDto>> listLeaveLedger(
            @QueryParam("employee_id") String empIdStr,
            @QueryParam("leave_type_id") String ltIdStr,
            @QueryParam("entry_type") String entryType,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("50") int size
    ) {
        UUID empId = (empIdStr != null && !empIdStr.isBlank()) ? UUID.fromString(empIdStr) : null;
        UUID ltId = (ltIdStr != null && !ltIdStr.isBlank()) ? UUID.fromString(ltIdStr) : null;
        PagedData<LeaveLedgerEntryDto> paged = leaveLedgerService.listLedgerEntries(empId, ltId, entryType, page, size);
        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_LEDGER_LIST_SUCCESS,
                "Leave ledger retrieved",
                paged.getItems(),
                paged.getPage(),
                paged.getSize(),
                paged.getTotalItems()
        );
    }
}

