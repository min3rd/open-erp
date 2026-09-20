package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.resource.BasePlatformResource;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import com.vn9melody.openerp.modules.plugin.service.PluginAuditService;
import com.vn9melody.openerp.modules.plugin.service.PluginBulkApplyService;
import com.vn9melody.openerp.modules.plugin.service.PluginEntitlementService;
import com.vn9melody.openerp.modules.plugin.service.PluginLifecycleService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * Platform governance + tenant support APIs (DES-03-API P12-P15, P19-P21,
 * TASK-308): entitlement management, tenant-private plugin registry/block and
 * lifecycle actions on behalf of a specific tenant. SUPER_ADMIN only; the audit
 * actor is the real platform admin (never an impersonation token, BUG-89).
 */
@Path("/api/v1/platform")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformPluginGovernanceResource extends BasePlatformResource {

    @Inject
    PluginAdminService pluginAdminService;

    @Inject
    PluginEntitlementService entitlementService;

    @Inject
    PluginLifecycleService lifecycleService;

    @Inject
    PluginAuditService auditService;

    @Inject
    PluginBulkApplyService bulkApplyService;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @GET
    @Path("/tenant-private-plugins")
    public Response listTenantPrivate() {
        requireSuperAdmin();
        List<PluginResponses.CatalogItem> items = pluginAdminService.listTenantPrivate();
        return Response.ok(ApiResponse.successList(PluginErrorCode.PLUGIN_TENANT_PRIVATE_LIST_SUCCESS,
                "Tenant-private plugins retrieved successfully.", items)).build();
    }

    @POST
    @Path("/tenant-private-plugins/{pluginKey}/block")
    public Response blockTenantPrivate(@PathParam("pluginKey") String pluginKey, PluginRequests.Block request) {
        PlatformActor actor = requireSuperAdmin();
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Plugin not found");
        }
        if (catalog.visibility != PluginVisibility.TENANT_PRIVATE) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID,
                    "This endpoint only manages tenant-private plugins");
        }
        PluginResponses.ActionResult result = pluginAdminService.blockCatalog(pluginKey, request, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BLOCK_SUCCESS,
                "Tenant-private plugin blocked.", result)).build();
    }

    @PUT
    @Path("/tenants/{tenantId}/plugins/{pluginKey}/entitlement")
    public Response grantEntitlement(@PathParam("tenantId") UUID tenantId,
                                     @PathParam("pluginKey") String pluginKey) {
        PlatformActor actor = requireSuperAdmin();
        entitlementService.grant(tenantId, pluginKey);
        auditService.platform(actor.userId, PlatformAction.PLUGIN_ENTITLEMENT_GRANTED, pluginKey, tenantId, null, null);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ENTITLEMENT_GRANT_SUCCESS,
                "Entitlement granted.", entitlementResult(pluginKey, "NOT_INSTALLED"))).build();
    }

    @DELETE
    @Path("/tenants/{tenantId}/plugins/{pluginKey}/entitlement")
    public Response revokeEntitlement(@PathParam("tenantId") UUID tenantId,
                                      @PathParam("pluginKey") String pluginKey) {
        PlatformActor actor = requireSuperAdmin();
        entitlementService.revoke(tenantId, pluginKey);
        auditService.platform(actor.userId, PlatformAction.PLUGIN_ENTITLEMENT_REVOKED, pluginKey, tenantId, null, null);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ENTITLEMENT_REVOKE_SUCCESS,
                "Entitlement revoked.", entitlementResult(pluginKey, null))).build();
    }

    @POST
    @Path("/plugins/{pluginKey}/bulk-apply/preview")
    public Response previewBulkApply(@PathParam("pluginKey") String pluginKey) {
        requireSuperAdmin();
        PluginResponses.BulkPreview preview = bulkApplyService.preview(pluginKey);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BULK_APPLY_PREVIEW_SUCCESS,
                "Bulk apply preview generated.", preview)).build();
    }

    @POST
    @Path("/plugins/{pluginKey}/bulk-apply")
    public Response applyBulk(@PathParam("pluginKey") String pluginKey, PluginRequests.BulkApply request) {
        PlatformActor actor = requireSuperAdmin();
        List<UUID> tenantIds = null;
        if (request != null && request.tenantIds != null) {
            tenantIds = request.tenantIds.stream().map(UUID::fromString).toList();
        }
        PluginResponses.BulkReport report = bulkApplyService.apply(pluginKey,
                request != null ? request.targetVersion : null,
                tenantIds, actor.userId, request != null ? request.reason : null);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BULK_APPLY_STARTED,
                "Bulk apply completed.", report)).build();
    }

    @POST
    @Path("/plugins/{pluginKey}/tenants/{tenantId}/install")
    public Response installForTenant(@PathParam("pluginKey") String pluginKey,
                                     @PathParam("tenantId") UUID tenantId,
                                     PluginRequests.PlatformLifecycle request) {
        PlatformActor actor = requireSuperAdmin();
        String version = request != null ? request.version : null;
        PluginResponses.OperationStatus status = lifecycleService.install(tenantId, pluginKey, version, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_INSTALL_STARTED,
                "Installation processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/plugins/{pluginKey}/tenants/{tenantId}/uninstall")
    public Response uninstallForTenant(@PathParam("pluginKey") String pluginKey,
                                       @PathParam("tenantId") UUID tenantId,
                                       PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.OperationStatus status = lifecycleService.uninstall(tenantId, pluginKey, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UNINSTALL_SUCCESS,
                "Uninstall processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/plugins/{pluginKey}/tenants/{tenantId}/enable")
    public Response enableForTenant(@PathParam("pluginKey") String pluginKey,
                                    @PathParam("tenantId") UUID tenantId,
                                    PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.OperationStatus status = lifecycleService.enable(tenantId, pluginKey, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ENABLE_SUCCESS,
                "Enable processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/plugins/{pluginKey}/tenants/{tenantId}/disable")
    public Response disableForTenant(@PathParam("pluginKey") String pluginKey,
                                     @PathParam("tenantId") UUID tenantId,
                                     PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.OperationStatus status = lifecycleService.disable(tenantId, pluginKey, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_DISABLE_SUCCESS,
                "Disable processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/plugins/{pluginKey}/tenants/{tenantId}/upgrade")
    public Response upgradeForTenant(@PathParam("pluginKey") String pluginKey,
                                     @PathParam("tenantId") UUID tenantId,
                                     PluginRequests.Upgrade request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.OperationStatus status = lifecycleService.upgrade(tenantId, pluginKey,
                request != null ? request.targetVersion : null,
                request != null ? request.snapshot : null,
                actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UPGRADE_STARTED,
                "Upgrade processed on behalf of tenant.", status)).build();
    }

    @POST
    @Path("/plugins/{pluginKey}/tenants/{tenantId}/rollback")
    public Response rollbackForTenant(@PathParam("pluginKey") String pluginKey,
                                      @PathParam("tenantId") UUID tenantId,
                                      PluginRequests.Rollback request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.OperationStatus status = lifecycleService.rollback(tenantId, pluginKey,
                request != null ? request.targetVersion : null,
                request != null ? request.restoreSnapshot : null,
                request != null ? request.reason : null,
                actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ROLLBACK_SUCCESS,
                "Rollback processed on behalf of tenant.", status)).build();
    }

    private PluginResponses.ActionResult entitlementResult(String pluginKey, String status) {
        PluginResponses.ActionResult result = new PluginResponses.ActionResult();
        result.pluginKey = pluginKey;
        result.catalogStatus = status;
        return result;
    }

    private PlatformActor requireSuperAdmin() {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                    "Only super administrators can manage plugin governance");
        }
        return actor;
    }
}
