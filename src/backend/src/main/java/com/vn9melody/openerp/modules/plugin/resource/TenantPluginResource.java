package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import com.vn9melody.openerp.modules.plugin.service.PluginArtifactUploadService;
import com.vn9melody.openerp.modules.plugin.service.PluginBundleImageService;
import com.vn9melody.openerp.modules.plugin.service.PluginLifecycleService;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.InputStream;
import java.util.List;
import org.jboss.resteasy.reactive.server.multipart.FormValue;
import org.jboss.resteasy.reactive.server.multipart.MultipartFormDataInput;

/**
 * Tenant plugin marketplace + lifecycle APIs (DES-03-API section 4, TASK-304):
 * T1/T3/T4/T5/T7. Tenant-private registration (T8/T14-T18) lands in TASK-316.
 */
@Path("/api/v1/tenant/plugins")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TenantPluginResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    PluginLifecycleService lifecycleService;

    @Inject
    PluginArtifactUploadService uploadService;

    @Inject
    PluginAdminService adminService;

    @Inject
    PluginBundleImageService bundleImageService;

    @Inject
    EntityManager entityManager;

    @GET
    @RequirePermission("core:plugin:read")
    public Response marketplace() {
        UserSecurityContext context = securityContextService.getCurrentContext();
        List<PluginResponses.MarketplaceItem> items = lifecycleService.listMarketplace(context.tenantId());
        return Response.ok(ApiResponse.successList(PluginErrorCode.PLUGIN_MARKETPLACE_LIST_SUCCESS,
                "Plugin marketplace retrieved successfully.", items)).build();
    }

    @GET
    @Path("/{pluginKey}")
    @RequirePermission("core:plugin:read")
    public Response detail(@PathParam("pluginKey") String pluginKey) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PluginResponses.CatalogDetail detail = lifecycleService.tenantDetail(context.tenantId(), pluginKey);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_DETAIL_SUCCESS,
                "Plugin detail retrieved successfully.", detail)).build();
    }

    @POST
    @Path("/{pluginKey}/install")
    @RequirePermission("core:plugin:install")
    public Response install(@PathParam("pluginKey") String pluginKey, PluginRequests.Install request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        String version = request != null ? request.version : null;
        bundleImageService.ensureBundleImage(pluginKey, version);
        PluginResponses.OperationStatus status = lifecycleService.install(context.tenantId(), pluginKey,
                version, context.userId());
        String code = "ACTIVE".equals(status.status)
                ? PluginErrorCode.PLUGIN_INSTALL_SUCCESS : PluginErrorCode.PLUGIN_INSTALL_STARTED;
        return Response.ok(ApiResponse.success(code, "Plugin installation processed.", status)).build();
    }

    @POST
    @Path("/{pluginKey}/enable")
    @RequirePermission("core:plugin:manage")
    public Response enable(@PathParam("pluginKey") String pluginKey) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PluginResponses.OperationStatus status = lifecycleService.enable(context.tenantId(), pluginKey,
                context.userId());
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ENABLE_SUCCESS,
                "Plugin enabled.", status)).build();
    }

    @POST
    @Path("/{pluginKey}/disable")
    @RequirePermission("core:plugin:manage")
    public Response disable(@PathParam("pluginKey") String pluginKey) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PluginResponses.OperationStatus status = lifecycleService.disable(context.tenantId(), pluginKey,
                context.userId());
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_DISABLE_SUCCESS,
                "Plugin disabled.", status)).build();
    }

    @POST
    @Path("/{pluginKey}/uninstall")
    @RequirePermission("core:plugin:manage")
    public Response uninstall(@PathParam("pluginKey") String pluginKey) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PluginResponses.OperationStatus status = lifecycleService.uninstall(context.tenantId(), pluginKey,
                context.userId());
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UNINSTALL_SUCCESS,
                "Plugin uninstalled (data retained).", status)).build();
    }

    @POST
    @Path("/artifacts/upload")
    @RequirePermission("core:plugin:register-custom")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadArtifact(MultipartFormDataInput input) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        if (!allowCustomPlugins(context.tenantId())) {
            throw new com.vn9melody.openerp.core.api.ApiException(403,
                    PluginErrorCode.PLUGIN_CUSTOM_NOT_ALLOWED,
                    "Custom plugins are not enabled for this tenant");
        }
        FormValue part = input.getValues().values().stream()
                .flatMap(parts -> parts.stream())
                .findFirst()
                .orElseThrow(() -> new com.vn9melody.openerp.core.api.ApiException(400,
                        PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID, "A file part is required"));
        try (InputStream content = part.getFileItem().getInputStream()) {
            PluginResponses.UploadResult result = uploadService.upload(part.getFileName(), content,
                    context.tenantId());
            return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                    PluginErrorCode.PLUGIN_ARTIFACT_UPLOAD_SUCCESS, "Artifact uploaded.", result)).build();
        } catch (java.io.IOException e) {
            throw new com.vn9melody.openerp.core.api.ApiException(500,
                    PluginErrorCode.PLUGIN_ARTIFACT_DOWNLOAD_FAILED, "Cannot read uploaded artifact");
        }
    }

    @POST
    @Path("/register")
    @RequirePermission("core:plugin:register-custom")
    public Response registerCustom(PluginRequests.TenantRegister request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        requireCustomPlugins(context.tenantId());
        if (request == null || request.pluginKey == null || request.pluginKey.isBlank()) {
            throw new com.vn9melody.openerp.core.api.ApiException(400,
                    PluginErrorCode.PLUGIN_ARTIFACT_INVALID_MANIFEST, "plugin_key is required");
        }
        assertArtifactOwnership(request.artifactRef, context.tenantId());
        PluginRequests.RegisterCatalog catalogRequest = new PluginRequests.RegisterCatalog();
        catalogRequest.pluginKey = request.pluginKey;
        catalogRequest.nameKey = request.nameKey;
        catalogRequest.descriptionKey = request.descriptionKey;
        PluginResponses.CatalogItem catalog = adminService.tenantCreateCatalog(context.tenantId(),
                context.userId(), catalogRequest);
        PluginResponses.VersionItem version = adminService.tenantRegisterVersion(context.tenantId(),
                context.userId(), catalog.pluginKey, request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                PluginErrorCode.PLUGIN_REGISTER_SUCCESS, "Custom plugin registered as DRAFT.", version)).build();
    }

    @DELETE
    @Path("/{pluginKey}/catalog")
    @RequirePermission("core:plugin:register-custom")
    public Response deleteCustomCatalog(@PathParam("pluginKey") String pluginKey) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        requireCustomPlugins(context.tenantId());
        adminService.tenantDeleteCatalog(context.tenantId(), pluginKey);
        PluginResponses.ActionResult result = new PluginResponses.ActionResult();
        result.pluginKey = pluginKey;
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CATALOG_DELETE_SUCCESS,
                "Custom plugin catalog deleted.", result)).build();
    }

    @GET
    @Path("/{pluginKey}/versions")
    @RequirePermission("core:plugin:read")
    public Response listCustomVersions(@PathParam("pluginKey") String pluginKey) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        List<PluginResponses.VersionItem> versions = adminService.tenantListVersions(context.tenantId(),
                pluginKey);
        return Response.ok(ApiResponse.successList(PluginErrorCode.PLUGIN_VERSION_LIST_SUCCESS,
                "Plugin versions retrieved successfully.", versions)).build();
    }

    @POST
    @Path("/{pluginKey}/versions")
    @RequirePermission("core:plugin:register-custom")
    public Response registerCustomVersion(@PathParam("pluginKey") String pluginKey,
                                          PluginRequests.RegisterVersion request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        requireCustomPlugins(context.tenantId());
        assertArtifactOwnership(request != null ? request.artifactRef : null, context.tenantId());
        PluginResponses.VersionItem version = adminService.tenantRegisterVersion(context.tenantId(),
                context.userId(), pluginKey, request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                PluginErrorCode.PLUGIN_VERSION_ADD_SUCCESS, "Version registered as DRAFT.", version)).build();
    }

    @PATCH
    @Path("/{pluginKey}/versions/{version}")
    @RequirePermission("core:plugin:register-custom")
    public Response customVersionAction(@PathParam("pluginKey") String pluginKey,
                                        @PathParam("version") String version,
                                        PluginRequests.VersionAction request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        requireCustomPlugins(context.tenantId());
        PluginResponses.ActionResult result = adminService.tenantVersionAction(context.tenantId(), pluginKey,
                version, request != null ? request.action : null, request != null ? request.reason : null,
                context.userId());
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_PUBLISH_SUCCESS,
                "Version action applied.", result)).build();
    }

    @DELETE
    @Path("/{pluginKey}/versions/{version}")
    @RequirePermission("core:plugin:register-custom")
    public Response deleteCustomVersion(@PathParam("pluginKey") String pluginKey,
                                        @PathParam("version") String version) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        requireCustomPlugins(context.tenantId());
        adminService.tenantDeleteVersion(context.tenantId(), pluginKey, version);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_VERSION_DELETE_SUCCESS,
                "Version removed.", null)).build();
    }

    private void requireCustomPlugins(java.util.UUID tenantId) {
        if (!allowCustomPlugins(tenantId)) {
            throw new com.vn9melody.openerp.core.api.ApiException(403,
                    PluginErrorCode.PLUGIN_CUSTOM_NOT_ALLOWED,
                    "Custom plugins are not enabled for this tenant");
        }
    }

    private void assertArtifactOwnership(String artifactRef, java.util.UUID tenantId) {
        if (artifactRef != null && !artifactRef.isBlank()) {
            uploadService.assertOwnedBy(artifactRef, tenantId);
        }
    }

    private boolean allowCustomPlugins(java.util.UUID tenantId) {
        Object value = entityManager.createNativeQuery(
                "SELECT allow_custom_plugins FROM tenants WHERE id = ?1")
                .setParameter(1, tenantId)
                .getSingleResult();
        return Boolean.TRUE.equals(value);
    }

    @POST
    @Path("/{pluginKey}/upgrade")
    @RequirePermission("core:plugin:manage")
    public Response upgrade(@PathParam("pluginKey") String pluginKey, PluginRequests.Upgrade request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        String targetVersion = request != null ? request.targetVersion : null;
        bundleImageService.ensureBundleImage(pluginKey, targetVersion);
        PluginResponses.OperationStatus status = lifecycleService.upgrade(context.tenantId(), pluginKey,
                targetVersion,
                request != null ? request.snapshot : null,
                context.userId());
        String code = "ACTIVE".equals(status.status)
                ? PluginErrorCode.PLUGIN_UPGRADE_SUCCESS : PluginErrorCode.PLUGIN_UPGRADE_STARTED;
        return Response.ok(ApiResponse.success(code, "Plugin upgrade processed.", status)).build();
    }
}
