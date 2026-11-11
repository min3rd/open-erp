package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.*;
import com.vn9melody.openerp.plugins.attendance.service.RequestTypeService;
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
public class RequestTypeAdminResource {

    @Inject
    RequestTypeService requestTypeService;

    @GET
    @Path("/request-types")
    public ApiResponse<ListData<RequestTypeDto>> listRequestTypes(@QueryParam("active_only") @DefaultValue("true") boolean activeOnly) {
        List<RequestTypeDto> list = requestTypeService.listRequestTypes(activeOnly);
        return ApiResponse.successList(
                AttendanceErrorCode.ATTENDANCE_REQUEST_TYPE_LIST_SUCCESS,
                "Request types retrieved",
                list
        );
    }

    @POST
    @Path("/admin/request-types")
    @RequirePermission("attendance:settings:manage")
    public ApiResponse<RequestTypeDto> createCustomType(RequestTypeCreateRequest request) {
        RequestTypeDto created = requestTypeService.createCustomType(request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_REQUEST_TYPE_CREATED,
                "Custom request type created successfully",
                created
        );
    }

    @PUT
    @Path("/admin/request-types/{id}")
    @RequirePermission("attendance:settings:manage")
    public ApiResponse<RequestTypeDto> updateRequestType(
            @PathParam("id") UUID id,
            RequestTypeUpdateRequest request
    ) {
        RequestTypeDto updated = requestTypeService.updateRequestType(id, request);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_REQUEST_TYPE_UPDATED,
                "Request type updated successfully",
                updated
        );
    }

    @DELETE
    @Path("/admin/request-types/{id}")
    @RequirePermission("attendance:settings:manage")
    public ApiResponse<Map<String, Object>> deleteRequestType(@PathParam("id") UUID id) {
        requestTypeService.deleteRequestType(id);
        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_REQUEST_TYPE_DELETED,
                "Request type deleted successfully",
                Map.of("id", id)
        );
    }
}

