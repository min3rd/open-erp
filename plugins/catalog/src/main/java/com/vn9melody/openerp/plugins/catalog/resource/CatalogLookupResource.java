package com.vn9melody.openerp.plugins.catalog.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogLookupDtos.InlineCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogLookupDtos.LookupTypeResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogLookupDtos.OptionResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogLookupDtos.ResolveRequest;
import com.vn9melody.openerp.plugins.catalog.service.CatalogLookupService;
import com.vn9melody.openerp.plugins.catalog.service.CatalogPermissionGuard;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * Lookup APIs for dynamic forms (DES-API-S05-001 section 4). The options contract
 * is pinned by the shared {@code catalog-picker}: query params {@code q},
 * {@code parent_id}, {@code as_of}, {@code page} (0-based) and {@code size}
 * (default 20, max 100).
 */
@Path("/api/v1/catalog/lookup")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CatalogLookupResource {

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    CatalogLookupService lookupService;

    /** Form renderer schema; any authenticated tenant user. */
    @GET
    @Path("/types")
    public Response types() {
        List<LookupTypeResponse> items = lookupService.types(guard.context().tenantId());
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_LOOKUP_TYPES_SUCCESS,
            "Catalog lookup types retrieved successfully.", items)).build();
    }

    @GET
    @Path("/{typeCode}/options")
    @RequirePermission("catalog:item:read")
    public Response options(@PathParam("typeCode") String typeCode,
                            @QueryParam("q") String q,
                            @QueryParam("parent_id") String parentId,
                            @QueryParam("as_of") String asOf,
                            @QueryParam("page") @DefaultValue("0") int page,
                            @QueryParam("size") @DefaultValue("20") int size) {
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_LOOKUP_OPTIONS_SUCCESS,
            "Catalog options retrieved successfully.",
            lookupService.options(guard.context().tenantId(), typeCode, q, parentId, asOf, page, size))).build();
    }

    @POST
    @Path("/{typeCode}/resolve")
    @RequirePermission("catalog:item:read")
    public Response resolve(@PathParam("typeCode") String typeCode,
                            @QueryParam("as_of") String asOf,
                            ResolveRequest request) {
        List<OptionResponse> items = lookupService.resolve(guard.context().tenantId(), typeCode, request, asOf);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_LOOKUP_RESOLVE_SUCCESS,
            "Catalog options resolved successfully.", items)).build();
    }

    @GET
    @Path("/{typeCode}/path")
    @RequirePermission("catalog:item:read")
    public Response path(@PathParam("typeCode") String typeCode,
                         @QueryParam("id") String id,
                         @QueryParam("as_of") String asOf) {
        List<OptionResponse> items = lookupService.path(guard.context().tenantId(), typeCode, id, asOf);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_LOOKUP_RESOLVE_SUCCESS,
            "Catalog breadcrumb retrieved successfully.", items)).build();
    }

    @POST
    @Path("/{typeCode}/inline")
    @RequirePermission("catalog:item:inline-create")
    public Response inline(@PathParam("typeCode") String typeCode, InlineCreateRequest request) {
        OptionResponse data = lookupService.inline(guard.context().tenantId(), typeCode, request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            CatalogErrorCode.CATALOG_LOOKUP_INLINE_SUCCESS,
            "Catalog item created inline successfully.", data)).build();
    }
}
