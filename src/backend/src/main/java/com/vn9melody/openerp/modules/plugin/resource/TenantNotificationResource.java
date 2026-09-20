package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginNotificationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * Tenant notifications (DES-03-API T12/T13, TASK-311).
 */
@Path("/api/v1/tenant/notifications")
@Produces(MediaType.APPLICATION_JSON)
public class TenantNotificationResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    PluginNotificationService notificationService;

    @GET
    public Response list(@QueryParam("unread_only") boolean unreadOnly) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        List<PluginResponses.NotificationItem> items = notificationService.list(context.tenantId(), unreadOnly);
        return Response.ok(ApiResponse.successList(PluginErrorCode.PLUGIN_NOTIFICATION_LIST_SUCCESS,
                "Notifications retrieved successfully.", items)).build();
    }

    @POST
    @Path("/{notificationId}/read")
    public Response markRead(@PathParam("notificationId") String notificationId) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        UUID id;
        try {
            id = UUID.fromString(notificationId);
        } catch (IllegalArgumentException e) {
            throw new com.vn9melody.openerp.core.api.ApiException(400,
                    PluginErrorCode.PLUGIN_NOTIFICATION_NOT_FOUND, "Invalid notification id");
        }
        notificationService.markRead(context.tenantId(), id);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_NOTIFICATION_READ_SUCCESS,
                "Notification marked as read.", null)).build();
    }

    @POST
    @Path("/read-all")
    public Response markAllRead() {
        UserSecurityContext context = securityContextService.getCurrentContext();
        notificationService.markAllRead(context.tenantId());
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_NOTIFICATION_READ_SUCCESS,
                "All notifications marked as read.", null)).build();
    }
}
