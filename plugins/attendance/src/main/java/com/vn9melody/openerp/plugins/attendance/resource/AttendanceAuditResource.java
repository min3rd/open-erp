package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AuditDtos.AuditLogDto;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceAuditService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AttendanceAuditResource {

    @Inject
    AttendanceAuditService auditService;

    @GET
    @Path("/audit")
    @RequirePermission("attendance:record:override")
    public ApiResponse<PagedData<AuditLogDto>> list(
            @QueryParam("action") String action,
            @QueryParam("entity_type") String entityType,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("50") int size) {
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_AUDIT_LIST_SUCCESS,
                "Attendance activity trail retrieved",
                auditService.list(action, entityType, page, size)
        );
    }
}
