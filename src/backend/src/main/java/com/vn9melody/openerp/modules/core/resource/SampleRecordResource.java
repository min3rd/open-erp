package com.vn9melody.openerp.modules.core.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.api.PagedData;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.core.dto.CreateSampleRecordRequest;
import com.vn9melody.openerp.modules.core.dto.SampleRecordResponse;
import com.vn9melody.openerp.modules.core.dto.ShareSampleRecordRequest;
import com.vn9melody.openerp.modules.core.dto.UpdateSampleRecordRequest;
import com.vn9melody.openerp.modules.core.service.SampleRecordService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;

/**
 * Reference Entity API proving the Data Permission Enforcement Engine end to
 * end (FEAT-17, TASK-284). Every endpoint declares its functional permission and
 * data operation; the engine filters reads and checks mutations.
 */
@Path("/api/v1/core/sample-records")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SampleRecordResource {

    public static final String PERM_READ = "core:sample-record:read";
    public static final String PERM_CREATE = "core:sample-record:create";
    public static final String PERM_UPDATE = "core:sample-record:update";
    public static final String PERM_DELETE = "core:sample-record:delete";
    public static final String PERM_EXPORT = "core:sample-record:export";
    public static final String PERM_SHARE = "core:sample-record:share";

    @Inject
    SampleRecordService sampleRecordService;

    @Inject
    SecurityContextService securityContextService;

    @POST
    @RequirePermission(value = PERM_CREATE, operation = DataOperation.CREATE)
    public Response create(@Valid CreateSampleRecordRequest request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        SampleRecordResponse data = sampleRecordService.create(context, request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            ErrorCode.CORE_SAMPLE_RECORD_CREATED, "Sample record created successfully.", data)).build();
    }

    @GET
    @RequirePermission(value = PERM_READ, operation = DataOperation.READ)
    public Response list(@QueryParam("page") @DefaultValue("0") int page,
                         @QueryParam("size") @DefaultValue("20") int size,
                         @QueryParam("keyword") String keyword,
                         @QueryParam("status") String status) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PagedData<SampleRecordResponse> data = sampleRecordService.list(context, page, size, keyword, status);
        return Response.ok(ApiResponse.successPaged(
            ErrorCode.CORE_SAMPLE_RECORD_LIST_SUCCESS, "Sample record list retrieved successfully.",
            data.getItems(), data.getPage(), data.getSize(), data.getTotalItems())).build();
    }

    @GET
    @Path("/{id}")
    @RequirePermission(value = PERM_READ, operation = DataOperation.READ)
    public Response get(@PathParam("id") UUID id) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        SampleRecordResponse data = sampleRecordService.get(context, id);
        return Response.ok(ApiResponse.success(
            ErrorCode.CORE_SAMPLE_RECORD_DETAIL_SUCCESS, "Sample record retrieved successfully.", data)).build();
    }

    @PUT
    @Path("/{id}")
    @RequirePermission(value = PERM_UPDATE, operation = DataOperation.UPDATE)
    public Response update(@PathParam("id") UUID id, UpdateSampleRecordRequest request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        SampleRecordResponse data = sampleRecordService.update(context, id, request);
        return Response.ok(ApiResponse.success(
            ErrorCode.CORE_SAMPLE_RECORD_UPDATED, "Sample record updated successfully.", data)).build();
    }

    @PATCH
    @Path("/{id}")
    @RequirePermission(value = PERM_UPDATE, operation = DataOperation.UPDATE)
    public Response patch(@PathParam("id") UUID id, UpdateSampleRecordRequest request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        SampleRecordResponse data = sampleRecordService.update(context, id, request);
        return Response.ok(ApiResponse.success(
            ErrorCode.CORE_SAMPLE_RECORD_UPDATED, "Sample record updated successfully.", data)).build();
    }

    @DELETE
    @Path("/{id}")
    @RequirePermission(value = PERM_DELETE, operation = DataOperation.DELETE)
    public Response delete(@PathParam("id") UUID id) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        SampleRecordResponse data = sampleRecordService.delete(context, id);
        return Response.ok(ApiResponse.success(
            ErrorCode.CORE_SAMPLE_RECORD_DELETED, "Sample record deleted successfully.", data)).build();
    }

    @POST
    @Path("/{id}/share")
    @RequirePermission(value = PERM_SHARE, operation = DataOperation.SHARE)
    public Response share(@PathParam("id") UUID id, @Valid ShareSampleRecordRequest request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        SampleRecordResponse data = sampleRecordService.share(context, id, request.assigneeId);
        return Response.ok(ApiResponse.success(
            ErrorCode.CORE_SAMPLE_RECORD_SHARED, "Sample record shared successfully.", data)).build();
    }

    @POST
    @Path("/export")
    @RequirePermission(value = PERM_EXPORT, operation = DataOperation.EXPORT)
    public Response export(@QueryParam("format") String format) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        SampleRecordService.ExportPayload payload = sampleRecordService.export(context, format);
        return Response.ok(ApiResponse.success(
            ErrorCode.CORE_SAMPLE_RECORD_EXPORTED, "Sample record data exported successfully.",
            payload.metadata())).build();
    }

    @GET
    @Path("/export")
    @Produces({MediaType.TEXT_PLAIN, MediaType.APPLICATION_JSON})
    @RequirePermission(value = PERM_EXPORT, operation = DataOperation.EXPORT)
    public Response downloadExport(@QueryParam("format") String format) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        SampleRecordService.ExportPayload payload = sampleRecordService.export(context, format);
        return Response.ok(payload.content())
            .type(payload.contentType())
            .header("Content-Disposition", "attachment; filename=\"" + payload.filename() + "\"")
            .build();
    }
}
