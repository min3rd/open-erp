package com.vn9melody.openerp.plugins.form.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

/**
 * Tenant bootstrap hook (called by PluginTenantBootstrapService after
 * install). The form plugin has nothing to seed yet — the endpoint exists so
 * the install saga completes cleanly for every tenant.
 */
@Path("/api/v1/form/internal")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FormInternalResource {

    @POST
    @Path("/tenant/bootstrap")
    public ApiResponse<Map<String, Object>> bootstrap() {
        return ApiResponse.success("FORM_BOOTSTRAP_SUCCESS", "Tenant bootstrapped.",
                Map.of("seeded", false));
    }
}
