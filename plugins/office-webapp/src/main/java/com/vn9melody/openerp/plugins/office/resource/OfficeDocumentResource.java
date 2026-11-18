package com.vn9melody.openerp.plugins.office.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.office.dto.CreateOfficeDocumentRequest;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentDto;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentPermissionDto;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentVersionDto;
import com.vn9melody.openerp.plugins.office.dto.ShareOfficeDocumentRequest;
import com.vn9melody.openerp.plugins.office.dto.UpdateOfficeDocumentRequest;
import com.vn9melody.openerp.plugins.office.service.OfficeDocumentService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.server.multipart.FormValue;
import org.jboss.resteasy.reactive.server.multipart.MultipartFormDataInput;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Path("/api/v1/office/documents")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OfficeDocumentResource {

    @Inject
    OfficeDocumentService service;

    @GET
    @RequirePermission("office:document:read")
    public ApiResponse<ListData<OfficeDocumentDto>> list() {
        return ApiResponse.successList(
                "OFFICE_DOCUMENTS_FETCH_SUCCESS",
                "Office documents retrieved.",
                service.list());
    }

    @POST
    @RequirePermission("office:document:write")
    public ApiResponse<OfficeDocumentDto> create(CreateOfficeDocumentRequest request) {
        return ApiResponse.success(
                "OFFICE_DOCUMENT_CREATED",
                "Office document created.",
                service.create(request));
    }

    @GET
    @Path("/{id}")
    @RequirePermission("office:document:read")
    public ApiResponse<OfficeDocumentDto> get(@PathParam("id") UUID id) {
        return ApiResponse.success(
                "OFFICE_DOCUMENTS_FETCH_SUCCESS",
                "Office document retrieved.",
                service.get(id));
    }

    @GET
    @Path("/{id}/versions")
    @RequirePermission("office:document:read")
    public ApiResponse<ListData<OfficeDocumentVersionDto>> versions(@PathParam("id") UUID id) {
        return ApiResponse.successList(
                "OFFICE_DOCUMENTS_FETCH_SUCCESS",
                "Office document versions retrieved.",
                service.versions(id));
    }

    @GET
    @Path("/{id}/permissions")
    @RequirePermission("office:document:write")
    public ApiResponse<ListData<OfficeDocumentPermissionDto>> permissions(@PathParam("id") UUID id) {
        return ApiResponse.successList(
                "OFFICE_DOCUMENTS_FETCH_SUCCESS",
                "Office document permissions retrieved.",
                service.permissions(id));
    }

    @POST
    @Path("/{id}/permissions")
    @RequirePermission("office:document:write")
    public ApiResponse<OfficeDocumentPermissionDto> share(@PathParam("id") UUID id,
                                                          ShareOfficeDocumentRequest request) {
        return ApiResponse.success(
                "OFFICE_DOCUMENT_SHARED",
                "Office document shared.",
                service.share(id, request));
    }

    @DELETE
    @Path("/{id}/permissions/{permissionId}")
    @RequirePermission("office:document:write")
    public ApiResponse<OfficeDocumentService.PermissionRevocation> revoke(@PathParam("id") UUID id,
                                                                           @PathParam("permissionId") UUID permissionId) {
        return ApiResponse.success(
                "OFFICE_DOCUMENT_SHARED",
                "Office document permission revoked.",
                service.revoke(id, permissionId));
    }

    @PUT
    @Path("/{id}/content")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RequirePermission("office:document:write")
    public ApiResponse<OfficeDocumentDto> uploadContent(@PathParam("id") UUID id, MultipartFormDataInput input) {
        FormValue file = firstFile(input);
        byte[] bytes;
        try (InputStream content = file.getFileItem().getInputStream()) {
            bytes = content.readAllBytes();
        } catch (IOException e) {
            throw new ApiException(400, "OFFICE_FILE_REQUIRED", "Cannot read the uploaded file",
                    java.util.Map.of("field", "file"));
        }
        Integer expectedVersion = intValue(formValue(input, "expected_version"));
        String changeNote = formValue(input, "change_note");
        return ApiResponse.success(
                "OFFICE_DOCUMENT_SAVED",
                "Office document content saved.",
                service.uploadContent(id, bytes, file.getFileName(), changeNote, expectedVersion));
    }

    @GET
    @Path("/{id}/content")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @RequirePermission("office:document:read")
    public Response downloadContent(@PathParam("id") UUID id, @QueryParam("version") Integer version) {
        OfficeDocumentService.StoredContent content = service.downloadContent(id, version);
        String encodedName = URLEncoder.encode(content.fileName() == null ? "document.bin" : content.fileName(),
                StandardCharsets.UTF_8).replace("+", "%20");
        return Response.ok(content.bytes())
                .type(content.mimeType() == null ? MediaType.APPLICATION_OCTET_STREAM : content.mimeType())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .header("ETag", "\"" + content.checksumSha256() + "\"")
                .header("X-Document-Version", content.version())
                .build();
    }

    @PATCH
    @Path("/{id}")
    @RequirePermission("office:document:write")
    public ApiResponse<OfficeDocumentDto> update(@PathParam("id") UUID id, UpdateOfficeDocumentRequest request) {
        return ApiResponse.success(
                "OFFICE_DOCUMENT_SAVED",
                "Office document updated.",
                service.update(id, request));
    }

    @DELETE
    @Path("/{id}")
    @RequirePermission("office:document:delete")
    public ApiResponse<OfficeDocumentDto> delete(@PathParam("id") UUID id) {
        return ApiResponse.success(
                "OFFICE_DOCUMENT_DELETED",
                "Office document deleted.",
                service.delete(id));
    }

    private static FormValue firstFile(MultipartFormDataInput input) {
        if (input == null) {
            throw new ApiException(400, "OFFICE_FILE_REQUIRED", "A multipart file part is required",
                    java.util.Map.of("field", "file"));
        }
        return input.getValues().values().stream()
                .flatMap(parts -> parts.stream())
                .filter(part -> part.isFileItem() && part.getFileName() != null && !part.getFileName().isBlank())
                .findFirst()
                .orElseThrow(() -> new ApiException(400, "OFFICE_FILE_REQUIRED",
                        "A multipart file part is required", java.util.Map.of("field", "file")));
    }

    private static String formValue(MultipartFormDataInput input, String name) {
        if (input == null) return null;
        return input.getValues().getOrDefault(name, List.of()).stream()
                .filter(part -> !part.isFileItem())
                .map(FormValue::getValue)
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse(null);
    }

    private static Integer intValue(String value) {
        try {
            return value == null ? null : Integer.valueOf(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
