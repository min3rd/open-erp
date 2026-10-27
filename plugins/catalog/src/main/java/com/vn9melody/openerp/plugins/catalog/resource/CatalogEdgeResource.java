package com.vn9melody.openerp.plugins.catalog.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.EdgeCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.EdgeResponse;
import com.vn9melody.openerp.plugins.catalog.service.CatalogEdgeService;
import com.vn9melody.openerp.plugins.catalog.service.CatalogPermissionGuard;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;

/**
 * Catalog relation edges (DES-API-S05-001 section 3): create validates visibility,
 * relation allow-list, cross-type parent allow-list and cycles; delete closes
 * {@code valid_to}.
 */
@Path("/api/v1/catalog/edges")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CatalogEdgeResource {

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    CatalogEdgeService edgeService;

    @POST
    @RequirePermission("catalog:item:manage")
    public Response create(EdgeCreateRequest request) {
        EdgeResponse data = edgeService.create(guard.context().tenantId(), request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            CatalogErrorCode.CATALOG_EDGE_CREATED_SUCCESS,
            "Catalog edge created successfully.", data)).build();
    }

    @DELETE
    @Path("/{id}")
    @RequirePermission("catalog:item:manage")
    public Response close(@PathParam("id") UUID id) {
        edgeService.close(guard.context().tenantId(), id);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_EDGE_CLOSED_SUCCESS,
            "Catalog edge closed successfully.", null)).build();
    }
}
