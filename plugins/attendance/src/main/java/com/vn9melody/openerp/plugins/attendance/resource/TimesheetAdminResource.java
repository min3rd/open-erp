package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import com.vn9melody.openerp.plugins.attendance.service.ExportTemplateService;
import com.vn9melody.openerp.plugins.attendance.service.TimesheetService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class TimesheetAdminResource {

    @Inject
    TimesheetService timesheetService;

    @Inject
    ExportTemplateService exportTemplateService;

    @Inject
    TenantContext tenantContext;

    // --- TIMESHEETS ---

    @GET
    @Path("/timesheets")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<PagedData<TimesheetDto>> listTimesheets(
            @QueryParam("period_year") Integer year,
            @QueryParam("period_month") Integer month,
            @QueryParam("scope_type") String scopeType,
            @QueryParam("step") String step,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("20") int size
    ) {
        PagedData<TimesheetDto> paged = timesheetService.listTimesheets(year, month, scopeType, step, page, size);
        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_TIMESHEET_LIST_SUCCESS,
                "Timesheets retrieved",
                paged.getItems(),
                paged.getPage(),
                paged.getSize(),
                paged.getTotalItems()
        );
    }

    @POST
    @Path("/timesheets")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<TimesheetDto> createTimesheet(TimesheetCreateRequest request) {
        UUID currentUserId = tenantContext.userId();
        TimesheetDto created = timesheetService.createTimesheet(currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_TIMESHEET_CREATED,
                "Timesheet created successfully",
                created
        );
    }

    @GET
    @Path("/timesheets/{id}")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<TimesheetDto> getTimesheet(@PathParam("id") UUID id) {
        TimesheetDto dto = timesheetService.getTimesheet(id);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_TIMESHEET_RETRIEVED,
                "Timesheet retrieved successfully",
                dto
        );
    }

    @POST
    @Path("/timesheets/{id}/step")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<TimesheetDto> transitionStep(
            @PathParam("id") UUID id,
            TimesheetStepRequest request
    ) {
        UUID currentUserId = tenantContext.userId();
        TimesheetDto updated = timesheetService.transitionStep(id, currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_TIMESHEET_STEP_SUCCESS,
                "Timesheet step updated successfully",
                updated
        );
    }

    @PUT
    @Path("/timesheets/{id}/records/{recordId}")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<Map<String, Object>> updateRecord(
            @PathParam("id") UUID id,
            @PathParam("recordId") UUID recordId,
            TimesheetRecordUpdateRequest request
    ) {
        UUID currentUserId = tenantContext.userId();
        timesheetService.updateRecordInStep4(id, recordId, currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_RECORD_OVERRIDDEN,
                "Attendance record updated in timesheet",
                Map.of("timesheet_id", id, "record_id", recordId)
        );
    }

    @POST
    @Path("/timesheets/{id}/send-confirmations")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<Map<String, Object>> sendConfirmations(
            @PathParam("id") UUID id,
            SendConfirmationsRequest request
    ) {
        UUID currentUserId = tenantContext.userId();
        int sent = timesheetService.sendConfirmations(id, currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_CONFIRMATIONS_SENT,
                "Confirmations sent successfully",
                Map.of("timesheet_id", id, "sent_count", sent)
        );
    }

    @GET
    @Path("/timesheets/{id}/confirmations")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<ListData<TimesheetConfirmationDto>> listConfirmations(
            @PathParam("id") UUID id,
            @QueryParam("status") String status
    ) {
        List<TimesheetConfirmationDto> list = timesheetService.listConfirmations(id, status);
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_CONFIRMATIONS_SENT,
                "Confirmations retrieved",
                list
        );
    }

    @POST
    @Path("/timesheets/{id}/lock")
    @RequirePermission("attendance:timesheet:lock")
    public ApiResponse<TimesheetDto> lockTimesheet(@PathParam("id") UUID id) {
        UUID currentUserId = tenantContext.userId();
        TimesheetDto locked = timesheetService.lockTimesheet(id, currentUserId);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_TIMESHEET_LOCKED,
                "Timesheet locked successfully",
                locked
        );
    }

    @POST
    @Path("/timesheets/{id}/unlock")
    @RequirePermission("attendance:timesheet:lock")
    public ApiResponse<TimesheetDto> unlockTimesheet(
            @PathParam("id") UUID id,
            TimesheetUnlockRequest request
    ) {
        UUID currentUserId = tenantContext.userId();
        String reason = request != null ? request.reason() : null;
        TimesheetDto unlocked = timesheetService.unlockTimesheet(id, currentUserId, reason);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_TIMESHEET_UNLOCKED,
                "Timesheet unlocked successfully",
                unlocked
        );
    }

    @POST
    @Path("/timesheets/{id}/export")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<TimesheetExportResponse> exportTimesheet(
            @PathParam("id") UUID id,
            TimesheetExportRequest request
    ) {
        UUID templateId = request != null ? request.templateId() : null;
        TimesheetExportResponse response = timesheetService.exportTimesheet(id, templateId);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_EXPORT_READY,
                "Timesheet export generated",
                response
        );
    }

    // --- EXPORT TEMPLATES ---

    @GET
    @Path("/export-templates")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<ListData<ExportTemplateDto>> listExportTemplates() {
        List<ExportTemplateDto> list = exportTemplateService.listTemplates();
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_EXPORT_TEMPLATE_LIST_SUCCESS,
                "Export templates retrieved",
                list
        );
    }

    @POST
    @Path("/export-templates")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<ExportTemplateDto> createExportTemplate(ExportTemplateCreateRequest request) {
        ExportTemplateDto created = exportTemplateService.createTemplate(request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_EXPORT_TEMPLATE_CREATED,
                "Export template created successfully",
                created
        );
    }

    @GET
    @Path("/export-templates/{id}")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<ExportTemplateDto> getExportTemplate(@PathParam("id") UUID id) {
        ExportTemplateDto dto = exportTemplateService.getTemplate(id);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_EXPORT_TEMPLATE_RETRIEVED,
                "Export template retrieved successfully",
                dto
        );
    }

    @PUT
    @Path("/export-templates/{id}")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<ExportTemplateDto> updateExportTemplate(
            @PathParam("id") UUID id,
            ExportTemplateUpdateRequest request
    ) {
        ExportTemplateDto updated = exportTemplateService.updateTemplate(id, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_EXPORT_TEMPLATE_UPDATED,
                "Export template updated successfully",
                updated
        );
    }

    @DELETE
    @Path("/export-templates/{id}")
    @RequirePermission("attendance:timesheet:manage")
    public ApiResponse<Map<String, Object>> deleteExportTemplate(@PathParam("id") UUID id) {
        exportTemplateService.deleteTemplate(id);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_EXPORT_TEMPLATE_DELETED,
                "Export template deleted successfully",
                Map.of("id", id)
        );
    }
}
