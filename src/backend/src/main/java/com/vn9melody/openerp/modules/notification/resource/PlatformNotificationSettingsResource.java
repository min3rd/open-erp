package com.vn9melody.openerp.modules.notification.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.modules.notification.dto.NotificationSettingsDto;
import com.vn9melody.openerp.modules.notification.service.NotificationSettingsService;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;

/** Platform-wide notification defaults; tenant admins read them, platform admins edit them. */
@Path("/api/v1/platform/notification-settings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformNotificationSettingsResource {

    @Inject
    NotificationSettingsService service;

    @Inject
    JsonWebToken jwt;

    @GET
    public Response get() {
        return Response.ok(ApiResponse.success(ErrorCode.NOTIFICATION_SETTINGS_SUCCESS,
                "Notification settings retrieved.", service.defaults())).build();
    }

    @PUT
    public Response save(NotificationSettingsDto request) {
        UUID userId = jwt.getSubject() == null ? null : UUID.fromString(jwt.getSubject());
        return Response.ok(ApiResponse.success(ErrorCode.NOTIFICATION_SETTINGS_SAVED,
                "Notification settings saved.", service.saveDefaults(request, userId))).build();
    }
}
