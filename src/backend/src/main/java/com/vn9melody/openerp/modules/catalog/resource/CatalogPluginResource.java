package com.vn9melody.openerp.modules.catalog.resource;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.modules.catalog.service.CatalogPluginManifestService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * The plugin's own descriptor (id, version, Desktop/Mobile feature matrix,
 * permissions, registered entities, UI screens) so developers and other plugins
 * can discover what the {@code catalog} plugin exposes without reading its code.
 * A distinct class root keeps it clear of the {@code /types} routing tree
 * (DES-API-S05-001 section 2.1 note).
 */
@Path("/api/v1/catalog/plugin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CatalogPluginResource {

    @Inject
    CatalogPluginManifestService manifestService;

    @GET
    @Path("/manifest")
    @RequirePermission("catalog:item:read")
    public Response manifest() {
        JsonNode manifest = manifestService.manifest();
        return Response.ok(ApiResponse.success(
            CatalogErrorCode.CATALOG_PLUGIN_MANIFEST_SUCCESS,
            "Catalog plugin manifest retrieved successfully.", manifest)).build();
    }
}
