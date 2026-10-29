package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.registry.EntityRegistryService;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

/** Public entity lookup used by CLI validation (`validate --core-url`). */
@Path("/api/v1/plugins/entity-registry")
@Produces(MediaType.APPLICATION_JSON)
public class PluginEntityRegistryResource {

    @Inject
    EntityRegistryService entityRegistryService;

    @GET
    @RequirePermission("core:plugin:read")
    public ApiResponse<PluginResponses.EntityRegistryEntry> lookup(@QueryParam("entity") String entity) {
        EntityRegistryService.Lookup found = entityRegistryService.lookup(entity)
                .orElseThrow(() -> new ApiException(404, PluginErrorCode.PLUGIN_ENTITY_TARGET_NOT_FOUND,
                        "Entity is not registered: " + entity));
        PluginResponses.EntityRegistryEntry dto = new PluginResponses.EntityRegistryEntry();
        dto.pluginId = found.pluginId();
        dto.entityName = found.entityName();
        dto.table = found.table();
        dto.storageType = found.storageType();
        dto.schemaDefinition = found.schemaDefinition();
        return ApiResponse.success("PLUGIN_ENTITY_REGISTRY_SUCCESS",
                "Entity registry entry retrieved.", dto);
    }
}
