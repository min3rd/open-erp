package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginLifecycleService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

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

    @GET
    @RequirePermission("core:plugin:read")
    public Response marketplace() {
        UserSecurityContext context = securityContextService.getCurrentContext();
        List<PluginResponses.MarketplaceItem> items = lifecycleService.listMarketplace(context.tenantId());
        return Response.ok(ApiResponse.successList(PluginErrorCode.PLUGIN_MARKETPLACE_LIST_SUCCESS,
                "Plugin marketplace retrieved successfully.", items)).build();
    }

    @POST
    @Path("/{pluginKey}/install")
    @RequirePermission("core:plugin:install")
    public Response install(@PathParam("pluginKey") String pluginKey, PluginRequests.Install request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PluginResponses.OperationStatus status = lifecycleService.install(context.tenantId(), pluginKey,
                request != null ? request.version : null, context.userId());
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
    @Path("/{pluginKey}/upgrade")
    @RequirePermission("core:plugin:manage")
    public Response upgrade(@PathParam("pluginKey") String pluginKey, PluginRequests.Upgrade request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PluginResponses.OperationStatus status = lifecycleService.upgrade(context.tenantId(), pluginKey,
                request != null ? request.targetVersion : null,
                request != null ? request.snapshot : null,
                context.userId());
        String code = "ACTIVE".equals(status.status)
                ? PluginErrorCode.PLUGIN_UPGRADE_SUCCESS : PluginErrorCode.PLUGIN_UPGRADE_STARTED;
        return Response.ok(ApiResponse.success(code, "Plugin upgrade processed.", status)).build();
    }
}
