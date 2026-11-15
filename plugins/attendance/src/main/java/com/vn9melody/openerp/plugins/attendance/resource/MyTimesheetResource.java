package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.MyTimesheetDto;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceEmployeeResolver;
import com.vn9melody.openerp.plugins.attendance.service.TimesheetService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.UUID;

/**
 * Self-service timesheet periods. Lives on the root path because {@code /admin}
 * is owned by the admin resource classes (RESTEasy routes by class prefix).
 */
@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class MyTimesheetResource {

    @Inject
    TimesheetService timesheetService;

    @Inject
    TenantContext tenantContext;

    @Inject
    AttendanceEmployeeResolver employeeResolver;

    @GET
    @Path("/my-timesheets")
    @RequirePermission("attendance:checkin:self")
    public ApiResponse<PagedData<MyTimesheetDto>> myTimesheets(
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        UUID employeeId = employeeResolver.resolve(tenantContext.userId());
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_TIMESHEET_LIST_SUCCESS,
                "My timesheet periods retrieved",
                timesheetService.listMyTimesheets(employeeId, page, size)
        );
    }
}
