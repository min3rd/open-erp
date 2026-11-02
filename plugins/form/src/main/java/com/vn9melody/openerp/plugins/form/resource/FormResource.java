package com.vn9melody.openerp.plugins.form.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.form.api.FormErrorCode;
import com.vn9melody.openerp.plugins.form.dto.FormDefinitionDto;
import com.vn9melody.openerp.plugins.form.dto.FormResponseDto;
import com.vn9melody.openerp.plugins.form.dto.SaveFormRequest;
import com.vn9melody.openerp.plugins.form.service.FormDefinitionService;
import com.vn9melody.openerp.plugins.form.service.FormResponseService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1/form")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FormResource {

    @Inject
    FormDefinitionService service;

    @Inject
    FormResponseService responseService;

    @GET
    @Path("/forms")
    @RequirePermission("form:definition:manage")
    public ApiResponse<ListData<FormDefinitionDto>> list() {
        return ApiResponse.successList(
                FormErrorCode.FORM_LIST_SUCCESS,
                "Forms retrieved.",
                service.list());
    }

    @POST
    @Path("/forms")
    @RequirePermission("form:definition:manage")
    public ApiResponse<FormDefinitionDto> create(SaveFormRequest request) {
        return ApiResponse.success(
                FormErrorCode.FORM_CREATED,
                "Form created.",
                service.create(request));
    }

    @GET
    @Path("/forms/{id}")
    @RequirePermission("form:definition:manage")
    public ApiResponse<FormDefinitionDto> get(@PathParam("id") UUID id) {
        return ApiResponse.success(
                FormErrorCode.FORM_RETRIEVED,
                "Form retrieved.",
                service.get(id));
    }

    @PUT
    @Path("/forms/{id}")
    @RequirePermission("form:definition:manage")
    public ApiResponse<FormDefinitionDto> update(@PathParam("id") UUID id, SaveFormRequest request) {
        return ApiResponse.success(
                FormErrorCode.FORM_UPDATED,
                "Form updated.",
                service.update(id, request));
    }

    @DELETE
    @Path("/forms/{id}")
    @RequirePermission("form:definition:manage")
    public ApiResponse<FormDefinitionDto> delete(@PathParam("id") UUID id) {
        service.delete(id);
        return ApiResponse.success(
                FormErrorCode.FORM_DELETED,
                "Form deleted.",
                null);
    }

    @POST
    @Path("/forms/{id}/publish")
    @RequirePermission("form:definition:manage")
    public ApiResponse<FormDefinitionDto> publish(@PathParam("id") UUID id,
            @QueryParam("captcha") String captcha,
            @QueryParam("close_at") String closeAt,
            @QueryParam("response_limit") Integer responseLimit) {
        return ApiResponse.success(
                FormErrorCode.FORM_PUBLISHED,
                "Form published.",
                service.publish(id, captcha, parseTime(closeAt), responseLimit));
    }

    @POST
    @Path("/forms/{id}/close")
    @RequirePermission("form:definition:manage")
    public ApiResponse<FormDefinitionDto> close(@PathParam("id") UUID id) {
        return ApiResponse.success(
                FormErrorCode.FORM_CLOSED,
                "Form closed.",
                service.close(id));
    }

    @GET
    @Path("/forms/{id}/responses")
    @RequirePermission("form:response:read")
    public ApiResponse<ListData<FormResponseDto>> responses(@PathParam("id") UUID id) {
        return ApiResponse.successList(
                FormErrorCode.FORM_RESPONSE_LIST_SUCCESS,
                "Responses retrieved.",
                responseService.list(id));
    }

    @GET
    @Path("/responses/{id}")
    @RequirePermission("form:response:read")
    public ApiResponse<FormResponseDto> response(@PathParam("id") UUID id) {
        return ApiResponse.success(
                FormErrorCode.FORM_RESPONSE_DETAIL_SUCCESS,
                "Response retrieved.",
                responseService.get(id));
    }

    @GET
    @Path("/forms/{id}/summary")
    @RequirePermission("form:response:read")
    public ApiResponse<Map<String, Object>> summary(@PathParam("id") UUID id) {
        return ApiResponse.success(
                "FORM_RESPONSE_SUMMARY_SUCCESS",
                "Response summary retrieved.",
                responseService.summary(id));
    }

    @GET
    @Path("/forms/{id}/responses/export")
    @RequirePermission("form:response:export")
    @Produces("text/csv")
    public String exportCsv(@PathParam("id") UUID id) {
        return responseService.exportCsv(id);
    }

    private OffsetDateTime parseTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value);
        } catch (Exception e) {
            throw new ApiException(400, FormErrorCode.FORM_DOCUMENT_INVALID,
                    "close_at must be an ISO-8601 timestamp");
        }
    }
}
