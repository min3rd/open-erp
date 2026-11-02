package com.vn9melody.openerp.plugins.workflow.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

/**
 * Root-level tenant bootstrap (PluginTenantBootstrapService contract:
 * POST {container}/internal/tenant/bootstrap with a service identity).
 * Seeds the employee-profile-change definition used by the employee plugin
 * (ADR-S08-004).
 */
@Path("/internal/tenant/bootstrap")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorkflowBootstrapResource {

    @Inject
    WorkflowInternalResource internalResource;

    @POST
    public ApiResponse<Map<String, Object>> bootstrap() {
        return internalResource.bootstrapTenant();
    }
}
