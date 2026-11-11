package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import com.vn9melody.openerp.plugins.attendance.service.TimesheetService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.UUID;

@Path("/confirmations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class TimesheetConfirmationResource {

    @Inject
    TimesheetService timesheetService;

    @Inject
    TenantContext tenantContext;

    @POST
    @Path("/{id}")
    @RequirePermission("attendance:timesheet:confirm")
    public ApiResponse<TimesheetConfirmationDto> actOnConfirmation(
            @PathParam("id") UUID id,
            TimesheetConfirmationActionRequest request
    ) {
        UUID currentUserId = tenantContext.userId();
        TimesheetConfirmationDto result = timesheetService.actOnConfirmation(id, currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_CONFIRMATION_RECORDED,
                "Confirmation recorded successfully",
                result
        );
    }
}

