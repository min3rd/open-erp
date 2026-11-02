package com.vn9melody.openerp.modules.eventhub.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.eventhub.model.PluginPublicSession;
import com.vn9melody.openerp.modules.eventhub.service.PluginManifestAccessService;
import com.vn9melody.openerp.modules.eventhub.service.PluginPublicRateLimiter;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import io.vertx.ext.web.RoutingContext;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * Anonymous session for public plugin surfaces (ADR-S08-003 §2). Issues a
 * short-lived PLUGIN_RUNTIME token bound to one tenant + one plugin with EMPTY
 * permissions, only for plugins that declare {@code public_access: true} and
 * are ACTIVE for the tenant. IP rate limited.
 */
@Path("/api/v1/plugins/public-session")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PluginPublicSessionResource {

    private static final long TOKEN_MINUTES = 15;

    @Inject
    PluginManifestAccessService manifestAccessService;

    @Inject
    PluginPublicRateLimiter rateLimiter;

    @Inject
    JwtTokenService jwtTokenService;

    public record PublicSessionRequest(String tenantSlug, String ref) {}

    public record PublicSession(String token, long expiresInSeconds, String pluginKey) {}

    @POST
    @Path("/{pluginKey}")
    public ApiResponse<PublicSession> issue(@PathParam("pluginKey") String pluginKey,
            @Context RoutingContext routingContext, PublicSessionRequest request) {
        rateLimiter.check(clientIp(routingContext));
        if (request == null || request.tenantSlug() == null || request.tenantSlug().isBlank()) {
            throw new ApiException(400, "TENANT_SLUG_REQUIRED", "tenant_slug is required");
        }
        Tenant tenant = Tenant.findBySlug(request.tenantSlug().trim().toLowerCase());
        if (tenant == null) {
            throw new ApiException(404, "PUBLIC_TENANT_NOT_FOUND", "Workspace is not available");
        }
        if (!manifestAccessService.activeLedger(tenant.id, pluginKey).isPresent()) {
            throw new ApiException(404, "PUBLIC_PLUGIN_NOT_AVAILABLE",
                    "This surface is not available");
        }
        if (!manifestAccessService.publicAccessEnabled(tenant.id, pluginKey)) {
            throw new ApiException(404, "PUBLIC_PLUGIN_NOT_AVAILABLE",
                    "This surface is not available");
        }
        String token = jwtTokenService.generatePluginRuntimeToken(
                null, tenant.id, pluginKey, TOKEN_MINUTES);
        PluginPublicSession session = new PluginPublicSession();
        session.tenantId = tenant.id;
        session.pluginKey = pluginKey;
        session.tokenHash = sha256(token);
        session.expiresAt = OffsetDateTime.now().plus(Duration.ofMinutes(TOKEN_MINUTES));
        session.ipHash = hashIp(clientIp(routingContext));
        session.persist();
        return ApiResponse.success("PLUGIN_PUBLIC_SESSION_ISSUED",
                "Public session issued.",
                new PublicSession(token, TOKEN_MINUTES * 60, pluginKey));
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

    private String hashIp(String ip) {
        return ip == null ? null : sha256("ip:" + ip);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
