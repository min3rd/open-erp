package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Issues short-lived iframe session tokens (TASK-343): the token is scoped to a
 * single (tenant, plugin) pair with the PLUGIN_RUNTIME type, so it cannot be
 * replayed against core APIs.
 */
@Path("/api/v1/plugins/session-token")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PluginRuntimeSessionResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    JwtTokenService jwtTokenService;

    @ConfigProperty(name = "openerp.plugin.gateway.session-token-minutes", defaultValue = "5")
    long tokenMinutes;

    @POST
    public Response issue(PluginRequests.RuntimeSession request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        String pluginKey = request == null ? null : request.pluginKey;
        if (pluginKey == null || pluginKey.isBlank()) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_NOT_FOUND, "plugin_key is required");
        }
        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(context.tenantId(), pluginKey)
                .orElseThrow(() -> new ApiException(403, PluginErrorCode.PLUGIN_DISABLED_FOR_TENANT,
                        "Plugin is not enabled for this tenant"));
        if (ledger.status != TenantPluginStatus.ACTIVE) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_DISABLED_FOR_TENANT,
                    "Plugin is not active for this tenant");
        }
        PluginResponses.RuntimeSession session = new PluginResponses.RuntimeSession();
        session.pluginKey = pluginKey;
        session.token = jwtTokenService.generatePluginRuntimeToken(context.userId(), context.tenantId(),
                pluginKey, tokenMinutes);
        session.expiresInSeconds = tokenMinutes * 60;
        session.entry = "/api/v1/plugins/runtime/" + pluginKey;
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_RUNTIME_SESSION_ISSUED,
                "Plugin runtime session issued.", session)).build();
    }
}
