package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.*;
import com.vn9melody.openerp.plugins.attendance.service.RequestService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.UUID;

@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class RequestResource {

    @Inject
    RequestService requestService;

    @Inject
    TenantContext tenantContext;

    @POST
    @Path("/requests")
    @RequirePermission("attendance:request:submit")
    public ApiResponse<RequestDto> submitRequest(RequestSubmitRequest request) {
        UUID currentUserId = tenantContext.userId();
        // By default subject employee is the current user's employee ref (or current user ID)
        UUID subjectEmployeeId = currentUserId;
        RequestDto submitted = requestService.submitRequest(subjectEmployeeId, currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_REQUEST_CREATED,
                "Request submitted successfully",
                submitted
        );
    }

    @GET
    @Path("/my-requests")
    @RequirePermission("attendance:request:submit")
    public ApiResponse<PagedData<RequestDto>> getMyRequests(
            @QueryParam("status") String status,
            @QueryParam("type") String typeCode,
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("20") int size
    ) {
        UUID currentUserId = tenantContext.userId();
        PagedData<RequestDto> paged = requestService.getMyRequests(currentUserId, status, typeCode, page, size);
        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_REQUEST_LIST_SUCCESS,
                "My requests retrieved",
                paged.getItems(),
                paged.getPage(),
                paged.getSize(),
                paged.getTotalItems()
        );
    }

    @GET
    @Path("/requests/inbox")
    @RequirePermission("attendance:request:approve")
    public ApiResponse<PagedData<RequestDto>> getInbox(
            @QueryParam("page") @DefaultValue("1") int page,
            @QueryParam("size") @DefaultValue("20") int size
    ) {
        UUID currentUserId = tenantContext.userId();
        PagedData<RequestDto> paged = requestService.getInboxRequests(currentUserId, page, size);
        return ApiResponse.successPaged(
                AttendanceErrorCode.ATTENDANCE_REQUEST_LIST_SUCCESS,
                "Inbox requests retrieved",
                paged.getItems(),
                paged.getPage(),
                paged.getSize(),
                paged.getTotalItems()
        );
    }

    @GET
    @Path("/requests/{id}")
    public ApiResponse<RequestDto> getRequest(@PathParam("id") UUID id) {
        RequestDto dto = requestService.getRequest(id);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_REQUEST_RETRIEVED,
                "Request retrieved successfully",
                dto
        );
    }

    @POST
    @Path("/requests/{id}/fallback-action")
    @RequirePermission("attendance:request:approve")
    public ApiResponse<RequestDto> fallbackAction(
            @PathParam("id") UUID id,
            FallbackActionRequest request
    ) {
        UUID currentUserId = tenantContext.userId();
        RequestDto updated = requestService.fallbackAction(id, currentUserId, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_REQUEST_ACTION_SUCCESS,
                "Request action executed successfully",
                updated
        );
    }
}

