package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceReportService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Path("/reports")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AttendanceReportResource {

    @Inject
    AttendanceReportService reportService;

    @Inject
    TenantContext tenantContext;

    @GET
    @Path("/summary")
    @RequirePermission("attendance:report:read")
    public ApiResponse<TimesheetSummaryReportDto> getSummaryReport(
            @QueryParam("scope_type") String scopeType,
            @QueryParam("scope_id") String scopeIdStr,
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr
    ) {
        UUID scopeId = (scopeIdStr != null && !scopeIdStr.isBlank()) ? UUID.fromString(scopeIdStr) : null;
        LocalDate from = (fromStr != null && !fromStr.isBlank()) ? LocalDate.parse(fromStr) : null;
        LocalDate to = (toStr != null && !toStr.isBlank()) ? LocalDate.parse(toStr) : null;

        TimesheetSummaryReportDto summary = reportService.getSummaryReport(scopeType, scopeId, from, to);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_REPORT_SUMMARY_SUCCESS,
                "Summary report generated successfully",
                summary
        );
    }

    @GET
    @Path("/team")
    @RequirePermission("attendance:report:read")
    public ApiResponse<ListData<TeamMemberReportDto>> getTeamReport(
            @QueryParam("manager_id") String managerIdStr,
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr
    ) {
        UUID managerId = (managerIdStr != null && !managerIdStr.isBlank())
                ? UUID.fromString(managerIdStr)
                : tenantContext.userId();
        LocalDate from = (fromStr != null && !fromStr.isBlank()) ? LocalDate.parse(fromStr) : null;
        LocalDate to = (toStr != null && !toStr.isBlank()) ? LocalDate.parse(toStr) : null;

        List<TeamMemberReportDto> team = reportService.getTeamReport(managerId, from, to);
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_REPORT_TEAM_SUCCESS,
                "Team report generated successfully",
                team
        );
    }

    @GET
    @Path("/top-late")
    @RequirePermission("attendance:report:read")
    public ApiResponse<ListData<TopLateReportDto>> getTopLateReport(
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr,
            @QueryParam("limit") @DefaultValue("10") int limit
    ) {
        LocalDate from = (fromStr != null && !fromStr.isBlank()) ? LocalDate.parse(fromStr) : null;
        LocalDate to = (toStr != null && !toStr.isBlank()) ? LocalDate.parse(toStr) : null;

        List<TopLateReportDto> list = reportService.getTopLateReport(from, to, limit);
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_REPORT_TOP_LATE_SUCCESS,
                "Top late report generated successfully",
                list
        );
    }

    @GET
    @Path("/overtime")
    @RequirePermission("attendance:report:read")
    public ApiResponse<ListData<OvertimeReportDto>> getOvertimeReport(
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr,
            @QueryParam("limit") @DefaultValue("10") int limit
    ) {
        LocalDate from = (fromStr != null && !fromStr.isBlank()) ? LocalDate.parse(fromStr) : null;
        LocalDate to = (toStr != null && !toStr.isBlank()) ? LocalDate.parse(toStr) : null;

        List<OvertimeReportDto> list = reportService.getOvertimeReport(from, to, limit);
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_REPORT_OVERTIME_SUCCESS,
                "Overtime report generated successfully",
                list
        );
    }
}
