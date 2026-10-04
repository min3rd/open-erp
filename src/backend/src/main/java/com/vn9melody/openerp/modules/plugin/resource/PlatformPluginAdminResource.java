package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.resource.BasePlatformResource;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import com.vn9melody.openerp.modules.plugin.service.PluginArtifactUploadService;
import com.vn9melody.openerp.modules.plugin.service.PluginBulkApplyService;
import com.vn9melody.openerp.modules.plugin.service.PluginBundleImageService;
import com.vn9melody.openerp.modules.plugin.service.PluginLifecycleService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import org.jboss.resteasy.reactive.server.multipart.FormValue;
import org.jboss.resteasy.reactive.server.multipart.MultipartFormDataInput;

/**
 * Platform plugin catalog administration (DES-03-API section 3, TASK-303):
 * P2/P3/P5/P6/P7/P8/P24/P25/P26. Only SUPER_ADMIN may write; SUPPORT_ENGINEER
 * keeps read-only access to plugin detail.
 */
@Path("/api/v1/platform/plugins")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformPluginAdminResource extends BasePlatformResource {

    @Inject
    PluginAdminService pluginAdminService;

    @Inject
    PluginArtifactUploadService uploadService;

    @Inject
    PluginBulkApplyService bulkApplyService;

    @Inject
    PluginBundleImageService bundleImageService;

    @Inject
    PluginLifecycleService lifecycleService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @POST
    public Response create(PluginRequests.RegisterCatalog request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.CatalogItem item = pluginAdminService.createCatalog(request, actor.userId);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                PluginErrorCode.PLUGIN_REGISTER_SUCCESS, "Plugin registered successfully.", item)).build();
    }

    @GET
    @Path("/{pluginKey}")
    public Response detail(@PathParam("pluginKey") String pluginKey) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN && actor.role != PlatformAdminRole.SUPPORT_ENGINEER) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED, "Platform role is required");
        }
        PluginResponses.CatalogDetail detail = pluginAdminService.getDetail(pluginKey);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_DETAIL_SUCCESS,
                "Plugin detail retrieved successfully.", detail)).build();
    }

    @GET
    @Path("/{pluginKey}/installations")
    public Response installations(@PathParam("pluginKey") String pluginKey,
                                  @QueryParam("page") @DefaultValue("0") int page,
                                  @QueryParam("size") @DefaultValue("20") int size) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN && actor.role != PlatformAdminRole.SUPPORT_ENGINEER) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                    "Platform role cannot read plugin installations");
        }
        PluginAdminService.InstallationPage result = pluginAdminService.installations(pluginKey, page, size);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_INSTALLATIONS_LIST_SUCCESS,
                "Plugin installations retrieved successfully.",
                com.vn9melody.openerp.core.api.PagedData.of(result.items(), result.page(), result.size(),
                        result.totalItems()))).build();
    }

    @PATCH
    @Path("/{pluginKey}")
    public Response update(@PathParam("pluginKey") String pluginKey, PluginRequests.UpdateCatalog request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.CatalogItem item = pluginAdminService.updateCatalog(pluginKey, request, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_METADATA_UPDATE_SUCCESS,
                "Plugin metadata updated successfully.", item)).build();
    }

    @DELETE
    @Path("/{pluginKey}")
    public Response delete(@PathParam("pluginKey") String pluginKey) {
        PlatformActor actor = requireSuperAdmin();
        pluginAdminService.deleteCatalog(pluginKey, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CATALOG_DELETE_SUCCESS,
                "Plugin catalog entry deleted successfully.", null)).build();
    }

    @POST
    @Path("/{pluginKey}/versions")
    public Response registerVersion(@PathParam("pluginKey") String pluginKey,
                                    PluginRequests.RegisterVersion request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.VersionItem item = pluginAdminService.registerVersion(pluginKey, request, actor.userId);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                PluginErrorCode.PLUGIN_VERSION_ADD_SUCCESS, "Plugin version registered.", item)).build();
    }

    @PATCH
    @Path("/{pluginKey}/versions/{version}")
    public Response versionAction(@PathParam("pluginKey") String pluginKey,
                                  @PathParam("version") String version,
                                  PluginRequests.VersionAction request) {
        PlatformActor actor = requireSuperAdmin();
        String action = request != null && request.action != null ? request.action.trim().toUpperCase() : "";
        if ("PUBLISH".equals(action)) {
            PluginResponses.ActionResult result = pluginAdminService.publishVersion(pluginKey, version,
                    request != null ? request.reason : null, actor.userId);
            return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_PUBLISH_SUCCESS,
                    "Plugin version published.", result)).build();
        }
        if ("DEPRECATE".equals(action)) {
            PluginResponses.ActionResult result = pluginAdminService.deprecateVersion(pluginKey, version,
                    request != null ? request.reason : null, actor.userId);
            return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_DEPRECATE_SUCCESS,
                    "Plugin version deprecated.", result)).build();
        }
        if ("BLOCK".equals(action)) {
            PluginResponses.ActionResult result = pluginAdminService.blockVersion(pluginKey, version,
                    request != null ? request.reason : null, actor.userId);
            return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BLOCK_SUCCESS,
                    "Plugin version blocked.", result)).build();
        }
        throw new ApiException(400, PluginErrorCode.PLUGIN_VERSION_NOT_VERIFIED, "Unsupported version action");
    }

    @PATCH
    @Path("/{pluginKey}/versions/{version}/unblock")
    public Response unblockVersion(@PathParam("pluginKey") String pluginKey,
                                   @PathParam("version") String version,
                                   PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.ActionResult result = pluginAdminService.unblockVersion(pluginKey, version,
                request != null ? request.reason : null, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UNBLOCK_SUCCESS,
                "Plugin version unblocked.", result)).build();
    }

    @POST
    @Path("/{pluginKey}/block")
    public Response block(@PathParam("pluginKey") String pluginKey, PluginRequests.Block request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.ActionResult result = pluginAdminService.blockCatalog(pluginKey, request, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BLOCK_SUCCESS,
                "Plugin blocked successfully.", result)).build();
    }

    @POST
    @Path("/{pluginKey}/unblock")
    public Response unblock(@PathParam("pluginKey") String pluginKey, PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.ActionResult result = pluginAdminService.unblockCatalog(pluginKey,
                request != null ? request.reason : null, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UNBLOCK_SUCCESS,
                "Plugin catalog unblocked.", result)).build();
    }

    @POST
    @Path("/artifacts/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadArtifact(MultipartFormDataInput input) {
        requireSuperAdmin();
        FormValue part = firstPart(input);        try (InputStream content = part.getFileItem().getInputStream()) {
            PluginResponses.UploadResult result = uploadService.upload(part.getFileName(), content, null);
            return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                    PluginErrorCode.PLUGIN_ARTIFACT_UPLOAD_SUCCESS, "Artifact uploaded.", result)).build();
        } catch (java.io.IOException e) {
            throw new ApiException(500, PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED,
                    "Cannot read uploaded artifact");
        }
    }

    /**
     * P10/P11 (DES-03-API): bulk apply preview + rollout. These methods live in
     * this resource (owner of {@code /api/v1/platform/plugins}) because JAX-RS
     * root-resource matching picks the longest class-level path and never falls
     * back to a shorter one (BUG-115).
     */
    @POST
    @Path("/{pluginKey}/bulk-apply/preview")
    public Response previewBulkApply(@PathParam("pluginKey") String pluginKey) {
        requireSuperAdmin();
        PluginResponses.BulkPreview preview = bulkApplyService.preview(pluginKey);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BULK_APPLY_PREVIEW_SUCCESS,
                "Bulk apply preview generated.", preview)).build();
    }

    @POST
    @Path("/{pluginKey}/bulk-apply")
    public Response applyBulk(@PathParam("pluginKey") String pluginKey, PluginRequests.BulkApply request) {
        PlatformActor actor = requireSuperAdmin();
        List<UUID> tenantIds = null;
        if (request != null && request.tenantIds != null) {
            tenantIds = request.tenantIds.stream().map(UUID::fromString).toList();
        }
        bundleImageService.ensureBundleImage(pluginKey, request != null ? request.targetVersion : null);
        PluginResponses.BulkReport report = bulkApplyService.apply(pluginKey,
                request != null ? request.targetVersion : null,
                tenantIds, actor.userId, request != null ? request.reason : null);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BULK_APPLY_STARTED,
                "Bulk apply completed.", report)).build();
    }

    /**
     * P19-P23 (DES-03-API): platform admin lifecycle actions on behalf of a
     * tenant. SUPER_ADMIN only; the audit actor is the real platform admin.
     */
    @POST
    @Path("/{pluginKey}/tenants/{tenantId}/install")
    public Response installForTenant(@PathParam("pluginKey") String pluginKey,
                                     @PathParam("tenantId") UUID tenantId,
                                     PluginRequests.PlatformLifecycle request) {
        PlatformActor actor = requireSuperAdmin();
        String version = request != null ? request.version : null;
        bundleImageService.ensureBundleImage(pluginKey, version);
        PluginResponses.OperationStatus status = lifecycleService.install(tenantId, pluginKey, version, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_INSTALL_STARTED,
                "Installation processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/{pluginKey}/tenants/{tenantId}/uninstall")
    public Response uninstallForTenant(@PathParam("pluginKey") String pluginKey,
                                       @PathParam("tenantId") UUID tenantId,
                                       PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.OperationStatus status = lifecycleService.uninstall(tenantId, pluginKey, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UNINSTALL_SUCCESS,
                "Uninstall processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/{pluginKey}/tenants/{tenantId}/enable")
    public Response enableForTenant(@PathParam("pluginKey") String pluginKey,
                                    @PathParam("tenantId") UUID tenantId,
                                    PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.OperationStatus status = lifecycleService.enable(tenantId, pluginKey, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ENABLE_SUCCESS,
                "Enable processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/{pluginKey}/tenants/{tenantId}/disable")
    public Response disableForTenant(@PathParam("pluginKey") String pluginKey,
                                     @PathParam("tenantId") UUID tenantId,
                                     PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.OperationStatus status = lifecycleService.disable(tenantId, pluginKey, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_DISABLE_SUCCESS,
                "Disable processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/{pluginKey}/tenants/{tenantId}/upgrade")
    public Response upgradeForTenant(@PathParam("pluginKey") String pluginKey,
                                     @PathParam("tenantId") UUID tenantId,
                                     PluginRequests.Upgrade request) {
        PlatformActor actor = requireSuperAdmin();
        String targetVersion = request != null ? request.targetVersion : null;
        bundleImageService.ensureBundleImage(pluginKey, targetVersion);
        PluginResponses.OperationStatus status = lifecycleService.upgrade(tenantId, pluginKey,
                targetVersion,
                request != null ? request.snapshot : null,
                actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UPGRADE_STARTED,
                "Upgrade processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/{pluginKey}/tenants/{tenantId}/rollback")
    public Response rollbackForTenant(@PathParam("pluginKey") String pluginKey,
                                      @PathParam("tenantId") UUID tenantId,
                                      PluginRequests.Rollback request) {
        PlatformActor actor = requireSuperAdmin();
        String targetVersion = request != null ? request.targetVersion : null;
        bundleImageService.ensureBundleImage(pluginKey, targetVersion);
        PluginResponses.OperationStatus status = lifecycleService.rollback(tenantId, pluginKey,
                targetVersion,
                request != null ? request.restoreSnapshot : null,
                request != null ? request.reason : null,
                actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ROLLBACK_SUCCESS,
                "Rollback processed on behalf of tenant.", status)).build();
    }

    private FormValue firstPart(MultipartFormDataInput input) {
        return input.getValues().values().stream()
                .flatMap(parts -> parts.stream())
                .findFirst()
                .orElseThrow(() -> new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID,
                        "A file part is required"));
    }

    private PlatformActor requireSuperAdmin() {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                    "Only super administrators can manage the plugin catalog");
        }
        return actor;
    }
}
