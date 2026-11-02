package com.vn9melody.openerp.plugins.form.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

/**
 * Root-level tenant bootstrap (PluginTenantBootstrapService contract:
 * POST {container}/internal/tenant/bootstrap with a service identity).
 */
@Path("/internal/tenant/bootstrap")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FormBootstrapResource {

    @POST
    public ApiResponse<Map<String, Object>> bootstrap() {
        return ApiResponse.success("FORM_BOOTSTRAP_SUCCESS", "Tenant bootstrapped.",
                Map.of("seeded", false));
    }
}
