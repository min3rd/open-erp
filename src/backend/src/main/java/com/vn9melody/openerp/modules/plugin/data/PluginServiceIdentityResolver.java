package com.vn9melody.openerp.modules.plugin.data;

import com.vn9melody.openerp.core.security.JwtTokenService;
import io.grpc.Metadata;
import io.smallrye.jwt.auth.principal.ParseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Collection;
import java.util.Locale;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Resolves the plugin identity from the service token. mTLS is the transport
 * guarantee; the token carries the tenant, plugin and scope so the gateway can
 * enforce authorization without trusting the request payload.
 */
@ApplicationScoped
public class PluginServiceIdentityResolver {

    public static final Metadata.Key<String> PLUGIN_KEY =
            Metadata.Key.of("x-plugin-key", Metadata.ASCII_STRING_MARSHALLER);
    public static final Metadata.Key<String> TENANT_ID =
            Metadata.Key.of("x-tenant-id", Metadata.ASCII_STRING_MARSHALLER);
    public static final Metadata.Key<String> SCOPE =
            Metadata.Key.of("x-scope", Metadata.ASCII_STRING_MARSHALLER);
    public static final Metadata.Key<String> SERVICE_TOKEN =
            Metadata.Key.of("x-service-token", Metadata.ASCII_STRING_MARSHALLER);
    public static final Metadata.Key<String> AUTHORIZATION =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);
    public static final Metadata.Key<String> REQUEST_ID =
            Metadata.Key.of("x-request-id", Metadata.ASCII_STRING_MARSHALLER);

    @Inject
    JwtTokenService jwtTokenService;

    @ConfigProperty(name = "openerp.plugin.data.require-token", defaultValue = "true")
    boolean requireToken;

    @ConfigProperty(name = "openerp.plugin.data.allow-system-metadata", defaultValue = "false")
    boolean allowSystemMetadata;

    public PluginServiceIdentity resolve(Metadata metadata) {
        String token = token(metadata);
        if (token != null) {
            return fromToken(token);
        }
        if (requireToken) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_SERVICE_TOKEN_REQUIRED");
        }
        String pluginKey = metadata.get(PLUGIN_KEY);
        String tenant = metadata.get(TENANT_ID);
        if (pluginKey == null || pluginKey.isBlank() || tenant == null || tenant.isBlank()) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_IDENTITY_REQUIRED");
        }
        PluginServiceIdentity.Scope scope = scope(metadata.get(SCOPE));
        if (scope == PluginServiceIdentity.Scope.SYSTEM && !allowSystemMetadata) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_SYSTEM_SCOPE_DENIED");
        }
        try {
            PluginServiceIdentity identity = new PluginServiceIdentity(pluginKey, UUID.fromString(tenant), scope);
            requireCertRole(identity);
            return identity;
        } catch (IllegalArgumentException e) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_TENANT_INVALID");
        }
    }

    private PluginServiceIdentity fromToken(String token) {
        final JsonWebToken jwt;
        try {
            jwt = jwtTokenService.parseToken(token);
        } catch (ParseException e) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_SERVICE_TOKEN_INVALID");
        }
        if (!JwtTokenService.TYPE_PLUGIN_SERVICE.equals(jwt.getClaim("type"))) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_SERVICE_TOKEN_WRONG_TYPE");
        }
        if (!audienceContainsPluginData(jwt.getClaim("aud"))) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_SERVICE_TOKEN_WRONG_AUDIENCE");
        }
        String pluginKey = jwt.getClaim("plugin_key");
        String tenant = jwt.getClaim("tenant_id");
        if (pluginKey == null || pluginKey.isBlank() || tenant == null || tenant.isBlank()) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_SERVICE_TOKEN_INCOMPLETE");
        }
        try {
            PluginServiceIdentity identity = new PluginServiceIdentity(pluginKey, UUID.fromString(tenant),
                    scope((String) jwt.getClaim("scope")));
            requireCertRole(identity);
            return identity;
        } catch (IllegalArgumentException e) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_SERVICE_TOKEN_INVALID");
        }
    }

    /** mTLS role and token scope must agree when a client certificate is present. */
    private void requireCertRole(PluginServiceIdentity identity) {
        String role = PluginMtlsInterceptor.clientRole();
        if (role == null) {
            return;
        }
        boolean matches = identity.system() ? "system".equals(role) : "tenant".equals(role);
        if (!matches) {
            throw new PluginDataException(PluginDataException.Code.INVALID_IDENTITY,
                    "PLUGIN_DATA_MTLS_IDENTITY_MISMATCH");
        }
    }

    private boolean audienceContainsPluginData(Object audience) {
        if (audience instanceof String value) {
            return "plugin-data".equals(value);
        }
        if (audience instanceof Collection<?> values) {
            return values.contains("plugin-data");
        }
        return false;
    }

    private PluginServiceIdentity.Scope scope(String raw) {
        return "SYSTEM".equalsIgnoreCase(raw) || "PLATFORM".equalsIgnoreCase(raw)
                ? PluginServiceIdentity.Scope.SYSTEM
                : PluginServiceIdentity.Scope.TENANT;
    }

    private String token(Metadata metadata) {
        String token = metadata.get(SERVICE_TOKEN);
        if (token == null || token.isBlank()) {
            String authorization = metadata.get(AUTHORIZATION);
            if (authorization != null && authorization.toLowerCase(Locale.ROOT).startsWith("bearer ")) {
                token = authorization.substring(7).trim();
            }
        }
        return token == null || token.isBlank() ? null : token;
    }
}
