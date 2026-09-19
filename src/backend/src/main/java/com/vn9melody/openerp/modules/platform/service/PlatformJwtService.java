package com.vn9melody.openerp.modules.platform.service;

import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Issues and parses the two platform-only token families:
 * <ul>
 *   <li>Platform admin access token: carries {@code platform_role} AND {@code groups}
 *       (BUG-65) plus {@code scope = PLATFORM}; never bound to a tenant.</li>
 *   <li>Impersonation token: binds the target tenant user as {@code sub}, carries
 *       {@code act_sub}/{@code act_email}/{@code impersonation_id}; never carries
 *       {@code platform_role} and never has a refresh token (TTL &lt;= 30 minutes).</li>
 * </ul>
 */
@ApplicationScoped
public class PlatformJwtService {

    public static final String CLAIM_PLATFORM_ROLE = "platform_role";
    public static final String CLAIM_SCOPE = "scope";
    public static final String CLAIM_SESSION_ID = "session_id";
    public static final String CLAIM_MUST_CHANGE_PASSWORD = "must_change_password";
    public static final String CLAIM_IS_IMPERSONATION = "is_impersonation";
    public static final String CLAIM_IMPERSONATION_ID = "impersonation_id";
    public static final String CLAIM_ACT_SUB = "act_sub";
    public static final String CLAIM_ACT_EMAIL = "act_email";
    public static final String CLAIM_SUPPORT_TICKET = "support_ticket";

    public static final String SCOPE_PLATFORM = "PLATFORM";
    public static final long PLATFORM_ACCESS_TTL_SECONDS = 900;
    public static final long IMPERSONATION_TTL_SECONDS = 1800;

    @Inject
    JWTParser jwtParser;

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    public String generatePlatformAccessToken(UUID userId, String email, PlatformAdminRole role,
                                              boolean mustChangePassword, String sessionId) {
        return Jwt.issuer(issuer)
            .upn(email)
            .subject(userId.toString())
            .claim("jti", UUID.randomUUID().toString())
            .claim("email", email)
            .claim("role", role.name())
            .claim(CLAIM_PLATFORM_ROLE, role.name())
            .claim(CLAIM_SCOPE, SCOPE_PLATFORM)
            .claim(CLAIM_MUST_CHANGE_PASSWORD, mustChangePassword)
            .claim(CLAIM_SESSION_ID, sessionId)
            .groups(Set.of(role.name()))
            .expiresIn(Duration.ofSeconds(PLATFORM_ACCESS_TTL_SECONDS))
            .sign();
    }

    /**
     * BUG-75: the impersonation token carries the {@code session_id} of the Redis
     * session created for the target user, exactly like a tenant access token, so
     * the organization/IAM session filters accept the delegated session.
     */
    public String generateImpersonationToken(UUID targetUserId, String targetEmail, UUID targetTenantId,
                                             String targetRole, UUID actorUserId, String actorEmail,
                                             UUID impersonationId, String supportTicket, String sessionId) {
        return Jwt.issuer(issuer)
            .upn(targetEmail)
            .subject(targetUserId.toString())
            .claim("jti", UUID.randomUUID().toString())
            .claim("email", targetEmail)
            .claim("tenant_id", targetTenantId.toString())
            .claim("target_user_id", targetUserId.toString())
            .claim("role", targetRole != null ? targetRole : "MEMBER")
            .claim(CLAIM_SESSION_ID, sessionId)
            .claim(CLAIM_IS_IMPERSONATION, true)
            .claim(CLAIM_IMPERSONATION_ID, impersonationId.toString())
            .claim(CLAIM_ACT_SUB, actorUserId.toString())
            .claim(CLAIM_ACT_EMAIL, actorEmail)
            .claim("impersonator_id", actorUserId.toString())
            .claim("impersonator_email", actorEmail)
            .claim(CLAIM_SUPPORT_TICKET, supportTicket)
            .expiresIn(Duration.ofSeconds(IMPERSONATION_TTL_SECONDS))
            .sign();
    }

    public JsonWebToken parse(String token) throws ParseException {
        return jwtParser.parse(token);
    }
}
