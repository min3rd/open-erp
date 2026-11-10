package com.vn9melody.openerp.plugins.form.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.form.api.FormErrorCode;
import com.vn9melody.openerp.plugins.form.dto.FormResponseDto;
import com.vn9melody.openerp.plugins.form.dto.SubmitResponseRequest;
import com.vn9melody.openerp.plugins.form.model.FormDefinition;
import com.vn9melody.openerp.plugins.form.service.FormCatalogService;
import com.vn9melody.openerp.plugins.form.service.CaptchaVerifier;
import com.vn9melody.openerp.plugins.form.service.FormFileService;
import com.vn9melody.openerp.plugins.form.service.FormResponseService;
import io.vertx.ext.web.RoutingContext;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import org.jboss.resteasy.reactive.MultipartForm;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.RestResponse;

/**
 * Public (anonymous) fill APIs (ADR-S08-003 §2.3). No @RequirePermission: the
 * anonymous PLUGIN_RUNTIME token carries empty permissions and the tenant comes
 * from the token, so tenant isolation still holds end-to-end.
 */
@Path("/api/v1/form/public")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FormPublicResource {

    @Inject
    FormResponseService responseService;

    @Inject
    CaptchaVerifier captchaVerifier;

    @Inject
    FormFileService fileService;

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext context;

    @Inject
    FormCatalogService catalogService;

    @GET
    @Path("/catalog/options/{type}")
    public ApiResponse<com.vn9melody.openerp.plugin.sdk.api.ListData<Map<String, Object>>> catalogOptions(@PathParam("type") String type) {
        return ApiResponse.successList(
                "CATALOG_OPTIONS_SUCCESS",
                "Catalog options retrieved.",
                catalogService.getOptions(type));
    }

    @GET
    @Path("/forms/{slug}")
    public ApiResponse<Map<String, Object>> view(@PathParam("slug") String slug) {
        FormDefinition form = loadBySlug(slug);
        if (!"PUBLISHED".equals(form.publishStatus())) {
            throw new ApiException(404, FormErrorCode.FORM_NOT_PUBLISHED,
                    "This form is not available");
        }
        return ApiResponse.success("FORM_PUBLIC_VIEW_SUCCESS", "Form retrieved.",
                Map.of(
                        "slug", form.slug(),
                        "title", form.titleText(),
                        "description", form.description() == null ? "" : form.description(),
                        "document", form.document(),
                        "captcha", form.captcha(),
                        "form_version", form.latestVersion(),
                        "accept_responses", form.acceptResponses(),
                        "close_at", form.closeAt() == null ? "" : form.closeAt().toString()));
    }

    @POST
    @Path("/forms/{slug}/responses")
    public ApiResponse<FormResponseDto> submit(@PathParam("slug") String slug,
            @Context RoutingContext routingContext, SubmitResponseRequest request) {
        if (request == null || request.idempotencyKey() == null
                || request.idempotencyKey().isBlank()) {
            throw new ApiException(400, "FORM_IDEMPOTENCY_KEY_REQUIRED",
                    "idempotency_key is required");
        }
        FormDefinition form = loadBySlug(slug);
        String captchaError = captchaVerifier.verify(form.captcha(), request.captchaToken());
        FormResponseDto response = responseService.submit(
                slug,
                request.answers(),
                request.responderEmail(),
                request.idempotencyKey(),
                ipHash(clientIp(routingContext)),
                captchaError,
                context.userId());
        return ApiResponse.success("FORM_PUBLIC_SUBMIT_SUCCESS",
                "Response submitted.",
                response);
    }

    @POST
    @Path("/forms/{slug}/files")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public ApiResponse<Map<String, Object>> upload(@PathParam("slug") String slug,
            @MultipartForm UploadForm form) {
        FormDefinition definition = loadBySlug(slug);
        if (form.file == null || form.file.length == 0) {
            throw new ApiException(400, "FORM_FILE_EMPTY", "File is required");
        }
        FormFileService.StoredFile stored = fileService.store(definition.id(),
                form.fileName == null || form.fileName.isBlank() ? "file" : form.fileName,
                form.contentType, form.file);
        return ApiResponse.success("FORM_PUBLIC_FILE_UPLOADED",
                "File uploaded.",
                Map.of(
                        "file_id", stored.fileId().toString(),
                        "url", fileService.signedUrl(stored.fileId()),
                        "original_name", form.fileName == null ? "" : form.fileName));
    }

    /** Signed download via the Core signed passthrough (path marker /signed-documents/). */
    @GET
    @Path("/signed-documents/{fileId}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public RestResponse<byte[]> download(@PathParam("fileId") UUID fileId,
            @QueryParam("expires") String expires, @QueryParam("sig") String signature) {
        fileService.verifySignature(fileId, expires, signature);
        Map<String, Object> file = fileService.loadFile(fileId);
        if (!"CLEAN".equals(file.get("scan_status")) && !"PENDING".equals(file.get("scan_status"))) {
            throw new ApiException(400, "FORM_FILE_INFECTED", "File failed the virus scan");
        }
        byte[] bytes = fileService.readStored(String.valueOf(file.get("storage_key")));
        return RestResponse.ResponseBuilder.ok(bytes)
                .header("Content-Disposition", "attachment; filename=\""
                        + file.get("original_name") + "\"")
                .build();
    }

    private FormDefinition loadBySlug(String slug) {
        var rows = client.query("form.get_by_slug", Map.of("slug", slug)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, FormErrorCode.FORM_NOT_FOUND, "Form was not found");
        }
        return FormDefinition.from(rows.get(0));
    }

    public static class UploadForm {
        @RestForm("file")
        public byte[] file;
        @RestForm("file_name")
        public String fileName;
        @RestForm("content_type")
        public String contentType;
    }

    private String clientIp(RoutingContext routingContext) {
        String forwarded = routingContext.request().getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return routingContext.request().remoteAddress() == null
                ? null
                : routingContext.request().remoteAddress().hostAddress();
    }

    private String ipHash(String ip) {
        if (ip == null) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(("ip:" + ip)
                    .getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return null;
        }
    }
}
