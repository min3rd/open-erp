package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class AccessTokenVerifier {

    @Inject
    JWTParser jwtParser;

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String expectedIssuer;

    public record VerifiedAccessToken(UUID userId, String jti, String sessionId, String role) {}

    public VerifiedAccessToken verifyBearer(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Unauthorized access: valid token required");
        }

        String token = authorizationHeader.substring(7).trim();
        if (token.isEmpty()) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Unauthorized access: valid token required");
        }

        try {
            JsonWebToken jwt = jwtParser.parse(token);

            String type = jwt.getClaim("type");
            if (type != null && !type.isBlank()) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid or expired access token");
            }

            if (expectedIssuer != null && !expectedIssuer.isBlank()
                    && !expectedIssuer.equals(jwt.getIssuer())) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid or expired access token");
            }

            long expiration = jwt.getExpirationTime();
            if (expiration > 0 && expiration <= Instant.now().getEpochSecond()) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid or expired access token");
            }

            UUID userId = UUID.fromString(jwt.getSubject());
            return new VerifiedAccessToken(userId, jwt.getTokenID(), jwt.getClaim("session_id"), jwt.getClaim("role"));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid or expired access token");
        }
    }
}
