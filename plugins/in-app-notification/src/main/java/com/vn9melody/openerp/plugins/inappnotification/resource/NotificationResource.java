package com.vn9melody.openerp.plugins.inappnotification.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.inappnotification.dto.CreateNotificationRequest;
import com.vn9melody.openerp.plugins.inappnotification.dto.NotificationDto;
import com.vn9melody.openerp.plugins.inappnotification.dto.NotificationPreferenceDto;
import com.vn9melody.openerp.plugins.inappnotification.dto.NotificationSettingsDto;
import com.vn9melody.openerp.plugins.inappnotification.dto.PreferenceRequest;
import com.vn9melody.openerp.plugins.inappnotification.dto.SaveNotificationSettingsRequest;
import com.vn9melody.openerp.plugins.inappnotification.service.NotificationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1/in-app-notification")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NotificationResource {

    @Inject
    NotificationService service;

    @GET
    @Path("/notifications")
    @RequirePermission("in-app-notification:notification:read")
    public ApiResponse<ListData<NotificationDto>> list() {
        return ApiResponse.successList(
                "IN_APP_NOTIFICATION_LIST_SUCCESS",
                "Notifications retrieved.",
                service.listMine());
    }

    @POST
    @Path("/notifications")
    @RequirePermission("in-app-notification:notification:manage")
    public ApiResponse<NotificationDto> create(CreateNotificationRequest request) {
        return ApiResponse.success(
                "IN_APP_NOTIFICATION_CREATED",
                "Notification created.",
                service.create(request));
    }

    @POST
    @Path("/notifications/{id}/read")
    @RequirePermission("in-app-notification:notification:read")
    public ApiResponse<Map<String, Object>> markRead(@PathParam("id") UUID id) {
        return ApiResponse.success(
                "IN_APP_NOTIFICATION_MARKED_READ",
                "Notification marked as read.",
                Map.of(ResponseKey.UPDATED_COUNT.getKey(), service.markRead(id)));
    }

    @POST
    @Path("/notifications/read-all")
    @RequirePermission("in-app-notification:notification:read")
    public ApiResponse<Map<String, Object>> markAllRead() {
        return ApiResponse.success(
                "IN_APP_NOTIFICATION_ALL_MARKED_READ",
                "All notifications marked as read.",
                Map.of(ResponseKey.UPDATED_COUNT.getKey(), service.markAllRead()));
    }

    @GET
    @Path("/settings")
    @RequirePermission("in-app-notification:notification:read")
    public ApiResponse<NotificationSettingsDto> settings() {
        return ApiResponse.success("IN_APP_NOTIFICATION_SETTINGS_SUCCESS",
                "Notification settings retrieved.", service.settings());
    }

    @PUT
    @Path("/settings")
    @RequirePermission("in-app-notification:settings:manage")
    public ApiResponse<NotificationSettingsDto> saveSettings(SaveNotificationSettingsRequest request) {
        return ApiResponse.success("IN_APP_NOTIFICATION_SETTINGS_SAVED",
                "Notification settings saved.", service.saveSettings(request));
    }

    @GET
    @Path("/preferences")
    @RequirePermission("in-app-notification:notification:read")
    public ApiResponse<NotificationPreferenceDto> preferences() {
        return ApiResponse.success(
                "IN_APP_NOTIFICATION_PREFERENCES_SUCCESS",
                "Notification preferences retrieved.",
                service.preferences());
    }

    @PUT
    @Path("/preferences")
    @RequirePermission("in-app-notification:settings:manage")
    public ApiResponse<NotificationPreferenceDto> savePreferences(PreferenceRequest request) {
        return ApiResponse.success(
                "IN_APP_NOTIFICATION_PREFERENCES_SAVED",
                "Notification preferences saved.",
                service.savePreferences(request));
    }
}
