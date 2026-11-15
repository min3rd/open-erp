package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.LeaveBalanceDto;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceEmployeeResolver;
import com.vn9melody.openerp.plugins.attendance.service.LeaveLedgerService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.UUID;

/**
 * Self-service leave balances. Lives on the root path because the {@code /admin}
 * prefix is owned by the admin resource classes (RESTEasy routes by class prefix).
 */
@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class MyLeaveResource {

    @Inject
    LeaveLedgerService leaveLedgerService;

    @Inject
    TenantContext tenantContext;

    @Inject
    AttendanceEmployeeResolver employeeResolver;

    @GET
    @Path("/my-leave-balances")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<ListData<LeaveBalanceDto>> getMyLeaveBalances() {
        UUID employeeId = employeeResolver.resolve(tenantContext.userId());
        List<LeaveBalanceDto> list = leaveLedgerService.getMyLeaveBalances(employeeId);
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_BALANCE_LIST_SUCCESS,
                "My leave balances retrieved",
                list
        );
    }
}
