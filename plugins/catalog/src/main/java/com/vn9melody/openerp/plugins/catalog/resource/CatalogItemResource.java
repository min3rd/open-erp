package com.vn9melody.openerp.plugins.catalog.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemParentResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemUpdateRequest;
import com.vn9melody.openerp.plugins.catalog.service.CatalogItemService;
import com.vn9melody.openerp.plugins.catalog.service.CatalogPermissionGuard;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * Item operations by id (DES-API-S05-001 section 3): detail with optional
 * relations, versioned update, close-validity delete, versions, parents and
 * descendants. The type-scoped list/create endpoints live in
 * {@link CatalogTypeResource} ({@code /api/v1/catalog/types/{code}/items}).
 */
@Path("/api/v1/catalog/items")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CatalogItemResource {

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    CatalogItemService itemService;

    @GET
    @Path("/{id}")
    @RequirePermission("catalog:item:read")
    public Response get(@PathParam("id") UUID id,
                        @QueryParam("as_of") String asOf,
                        @QueryParam("with_relations") @DefaultValue("false") boolean withRelations) {
        ItemResponse data = itemService.get(guard.context().tenantId(), id, asOf, withRelations);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "Catalog item retrieved successfully.", data)).build();
    }

    @PUT
    @Path("/{id}")
    @RequirePermission("catalog:item:manage")
    public Response update(@PathParam("id") UUID id, ItemUpdateRequest request) {
        ItemResponse data = itemService.update(guard.context().tenantId(), id, request);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_ITEM_UPDATED_SUCCESS,
            "Catalog item updated successfully.", data)).build();
    }

    @DELETE
    @Path("/{id}")
    @RequirePermission("catalog:item:manage")
    public Response close(@PathParam("id") UUID id) {
        itemService.close(guard.context().tenantId(), id);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_ITEM_CLOSED_SUCCESS,
            "Catalog item closed successfully.", null)).build();
    }

    @GET
    @Path("/{id}/versions")
    @RequirePermission("catalog:item:read")
    public Response versions(@PathParam("id") UUID id) {
        List<ItemResponse> items = itemService.versions(guard.context().tenantId(), id);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "Catalog item versions retrieved successfully.", items)).build();
    }

    @GET
    @Path("/{id}/parents")
    @RequirePermission("catalog:item:read")
    public Response parents(@PathParam("id") UUID id, @QueryParam("as_of") String asOf) {
        List<ItemParentResponse> items = itemService.parents(guard.context().tenantId(), id, asOf);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "Catalog item parents retrieved successfully.", items)).build();
    }

    @GET
    @Path("/{id}/descendants")
    @RequirePermission("catalog:item:read")
    public Response descendants(@PathParam("id") UUID id,
                                @QueryParam("as_of") String asOf,
                                @QueryParam("depth") Integer depth) {
        List<ItemResponse> items = itemService.descendants(guard.context().tenantId(), id, asOf, depth);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "Catalog item descendants retrieved successfully.", items)).build();
    }
}
