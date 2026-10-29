package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.enums.UserRole;
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

@ApplicationScoped
public class JwtTokenService {

    public static final String TYPE_PRE_AUTH = "PRE_AUTH";
    public static final String TYPE_REFRESH = "REFRESH";
    public static final String TYPE_PLUGIN_RUNTIME = "PLUGIN_RUNTIME";
    public static final String TYPE_PLUGIN_SERVICE = "PLUGIN_SERVICE";

    @Inject
    JWTParser jwtParser;

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    public String generateAccessToken(UUID userId, String email, UUID tenantId, String role, String sessionId) {
        return generateAccessToken(userId, email, tenantId, role, sessionId, null);
    }

    /**
     * Tenant access token carrying the resolved functional permission codes so the
     * frontend guard can render navigation without an extra round-trip (TASK-267
     * Wave 3). The backend never trusts this claim for enforcement: the
     * {@code PermissionEnforcementFilter} always re-resolves the
     * {@link com.vn9melody.openerp.core.context.UserSecurityContext} from the database.
     */
    public String generateAccessToken(UUID userId, String email, UUID tenantId, String role, String sessionId,
                                      Set<String> permissions) {
        return Jwt.issuer(issuer)
                .upn(email)
                .subject(userId.toString())
                .claim("jti", UUID.randomUUID().toString())
                .claim("email", email)
                .claim("tenant_id", tenantId != null ? tenantId.toString() : null)
                .claim("role", role != null ? role : "MEMBER")
                .claim("session_id", sessionId)
                .claim("permissions", permissions != null ? permissions : Set.of())
                .groups(role != null ? Set.of(role) : Set.of("MEMBER"))
                .expiresIn(Duration.ofMinutes(15))
                .sign();
    }

    public String generateAccessToken(UUID userId, String email, UUID tenantId, UserRole role, String sessionId) {
        return generateAccessToken(userId, email, tenantId, role != null ? role.name() : "MEMBER", sessionId);
    }

    public String generateRefreshToken(UUID userId, UUID tenantId, String role, String sessionId) {
        return Jwt.issuer(issuer)
                .subject(userId.toString())
                .claim("jti", UUID.randomUUID().toString())
                .claim("type", TYPE_REFRESH)
                .claim("tenant_id", tenantId != null ? tenantId.toString() : null)
                .claim("role", role != null ? role : "MEMBER")
                .claim("session_id", sessionId)
                .expiresIn(Duration.ofDays(7))
                .sign();
    }

    public String generatePreAuthToken(UUID userId, String purpose, String jti) {
        return Jwt.issuer(issuer)
                .subject(userId.toString())
                .claim("jti", jti)
                .claim("type", TYPE_PRE_AUTH)
                .claim("purpose", purpose)
                .expiresIn(Duration.ofMinutes(5))
                .sign();
    }

    /**
     * Short-lived token for plugin runtime asset loading (TASK-343): scoped to
     * one (tenant, plugin) pair and unusable for core APIs because of its type.
     */
    public String generatePluginRuntimeToken(UUID userId, UUID tenantId, String pluginKey, long minutes) {
        return generatePluginRuntimeToken(userId, tenantId, pluginKey, minutes, java.util.Set.of(), java.util.Set.of());
    }

    public String generatePluginRuntimeToken(UUID userId, UUID tenantId, String pluginKey, long minutes,
                                             java.util.Set<String> permissions, java.util.Set<String> roles) {
        return Jwt.issuer(issuer)
                .subject(userId != null ? userId.toString() : "")
                .claim("jti", UUID.randomUUID().toString())
                .claim("type", TYPE_PLUGIN_RUNTIME)
                .claim("tenant_id", tenantId != null ? tenantId.toString() : null)
                .claim("plugin_key", pluginKey)
                .claim("permissions", permissions == null ? java.util.List.of() : java.util.List.copyOf(permissions))
                .claim("roles", roles == null ? java.util.List.of() : java.util.List.copyOf(roles))
                .expiresIn(Duration.ofMinutes(minutes))
                .sign();
    }

    public JsonWebToken parseToken(String token) throws ParseException {
        return jwtParser.parse(token);
    }

    /**
     * Short-lived identity for the plugin data gateway (SOL-S05-002 D5/D11).
     * It is not a user token: subject is the plugin, and the only authority is
     * the tenant/scope pair bound to the plugin deployment.
     */
    public String generatePluginServiceToken(UUID tenantId, String pluginKey, String scope, Duration ttl) {
        return Jwt.issuer(issuer)
                .subject("plugin:" + pluginKey)
                .claim("jti", UUID.randomUUID().toString())
                .claim("type", TYPE_PLUGIN_SERVICE)
                .claim("tenant_id", tenantId != null ? tenantId.toString() : null)
                .claim("plugin_key", pluginKey)
                .claim("scope", scope != null ? scope : "TENANT")
                .claim("aud", "plugin-data")
                .expiresIn(ttl != null ? ttl : Duration.ofHours(24))
                .sign();
    }
}
