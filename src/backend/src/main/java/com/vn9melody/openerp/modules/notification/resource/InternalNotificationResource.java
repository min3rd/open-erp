package com.vn9melody.openerp.modules.notification.resource;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.plugin.service.PluginRuntimeGatewayService;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

/**
 * Internal producer used by plugins that need to notify an existing tenant user.
 * The in-app-notification plugin owns the notification rows; Core only forwards
 * with a short-lived service identity, so no plugin reads another plugin's tables.
 */
@Path("/api/v1/internal/notifications")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InternalNotificationResource {

    private static final Logger LOG = Logger.getLogger(InternalNotificationResource.class);

    @Inject
    EntityManager entityManager;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    PluginRuntimeGatewayService gatewayService;

    @Inject
    ObjectMapper objectMapper;

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record OnboardingInviteNotification(
        String email,
        String inviteLink,
        String expiresAt,
        String title,
        String body
    ) {
    }

    public record NotifyResult(
        @JsonProperty("notified") boolean notified,
        @JsonProperty("reason") String reason,
        @JsonProperty("user_id") String userId
    ) {
        static NotifyResult skipped(String reason) {
            return new NotifyResult(false, reason, null);
        }
    }

    @POST
    @Path("/onboarding-invite")
    public ApiResponse<NotifyResult> onboardingInvite(
            @HeaderParam("X-Plugin-Service-Token") String token,
            OnboardingInviteNotification request) {
        UUID tenantId = authenticate(token);
        if (request == null || request.email() == null || request.email().isBlank()) {
            throw new ApiException(400, ErrorCode.VALIDATION_FAILED, "email is required");
        }
        List<?> userIds = entityManager.createNativeQuery("""
                select u.id from users u
                join user_tenants ut on ut.user_id = u.id
                where lower(u.email) = lower(?1) and ut.tenant_id = ?2 and u.status = 'ACTIVE'
                """)
            .setParameter(1, request.email().trim())
            .setParameter(2, tenantId)
            .getResultList();
        if (userIds.isEmpty()) {
            return ApiResponse.success("NOTIFICATION_SKIPPED", "User is not registered in this workspace.",
                NotifyResult.skipped("USER_NOT_IN_TENANT"));
        }
        UUID userId = (UUID) userIds.get(0);
        String title = request.title() != null && !request.title().isBlank()
            ? request.title()
            : "Lời mời hoàn thiện hồ sơ nhân viên";
        String body = request.body() != null && !request.body().isBlank()
            ? request.body()
            : "Bạn được mời hoàn thiện hồ sơ nhân viên. Mở liên kết sau: " + request.inviteLink();
        try {
            byte[] payload = objectMapper.writeValueAsBytes(Map.of(
                "recipient_id", userId.toString(),
                "recipient_text", "",
                "title", title,
                "body", body,
                "level", "INFO"
            ));
            gatewayService.forward(
                tenantId,
                userId,
                Set.of("in-app-notification:notification:manage"),
                Set.of("TENANT_ADMIN"),
                Set.of(),
                "in-app-notification",
                null,
                "POST",
                "/api/v1/in-app-notification/notifications",
                null,
                "application/json",
                payload
            );
            return ApiResponse.success("NOTIFICATION_SENT", "Notification sent.",
                new NotifyResult(true, null, userId.toString()));
        } catch (Exception e) {
            LOG.warnf("Cannot deliver onboarding notification to %s: %s", request.email(), e.getMessage());
            return ApiResponse.success("NOTIFICATION_SKIPPED", "Notification channel is unavailable.",
                new NotifyResult(false, "NOTIFICATION_UNAVAILABLE", userId.toString()));
        }
    }

    private UUID authenticate(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Service token is required");
        }
        try {
            JsonWebToken jwt = jwtTokenService.parseToken(token);
            String type = jwt.getClaim("type");
            String tokenTenant = jwt.getClaim("tenant_id");
            if (!JwtTokenService.TYPE_PLUGIN_SERVICE.equals(type)) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid service token");
            }
            if (tokenTenant == null) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Service token tenant is missing");
            }
            return UUID.fromString(tokenTenant);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid service token");
        }
    }
}
