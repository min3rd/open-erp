package com.vn9melody.openerp.modules.notification.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.notification.service.NotificationSettingsService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/** Read-only platform defaults for tenant admins. */
@Path("/api/v1/tenant/notification-defaults")
@Produces(MediaType.APPLICATION_JSON)
public class TenantNotificationDefaultsResource {

    @Inject
    NotificationSettingsService service;

    @GET
    @RequirePermission("core:tenant:settings-manage")
    public Response get() {
        return Response.ok(ApiResponse.success(ErrorCode.NOTIFICATION_SETTINGS_SUCCESS,
                "Notification defaults retrieved.", service.defaults())).build();
    }
}
