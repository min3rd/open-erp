package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.modules.platform.api.PlatformSupport;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import io.vertx.core.http.HttpServerRequest;
import jakarta.ws.rs.core.HttpHeaders;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;

/** Shared helpers for platform resources: caller identity + client metadata. */
public abstract class BasePlatformResource {

    protected PlatformActor actor(jakarta.ws.rs.container.ContainerRequestContext context,
                                  HttpServerRequest request, HttpHeaders headers) {
        JsonWebToken jwt = (JsonWebToken) context.getProperty(PlatformSupport.JWT_CONTEXT_PROPERTY);
        if (jwt == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Platform identity is required");
        }
        UUID userId;
        try {
            userId = UUID.fromString(jwt.getSubject());
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid platform token subject");
        }
        String email = PlatformSupport.claim(jwt, "email");
        String roleClaim = PlatformSupport.claim(jwt, "platform_role");
        PlatformAdminRole role = PlatformAdminRole.fromString(roleClaim);
        return PlatformActor.of(userId, email, role, extractClientIp(request), extractUserAgent(headers));
    }

    protected String extractClientIp(HttpServerRequest request) {
        if (request == null) {
            return "unknown";
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String first = forwardedFor.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        if (request.remoteAddress() != null && request.remoteAddress().host() != null) {
            return request.remoteAddress().host();
        }
        return "unknown";
    }

    protected String extractUserAgent(HttpHeaders headers) {
        if (headers == null) {
            return null;
        }
        return headers.getHeaderString("User-Agent");
    }
}
