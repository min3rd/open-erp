package com.vn9melody.openerp.plugins.catalog.resource;

import com.vn9melody.openerp.plugins.catalog.api.ApiException;
import com.vn9melody.openerp.plugins.catalog.api.ApiResponse;
import com.vn9melody.openerp.plugins.catalog.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogSupport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogImportExportDtos.CsvFile;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogImportExportDtos.ImportReport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.GrantReplaceRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.GrantResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeUpdateRequest;
import com.vn9melody.openerp.plugins.catalog.service.CatalogImportExportService;
import com.vn9melody.openerp.plugins.catalog.service.CatalogItemService;
import com.vn9melody.openerp.plugins.catalog.service.CatalogPermissionGuard;
import com.vn9melody.openerp.plugins.catalog.service.CatalogTypeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

/**
 * Catalog type administration + per-type grants (DES-API-S05-001 section 2).
 * Tenant scope comes from the authenticated security context, never from the client.
 */
@Path("/api/v1/catalog/types")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CatalogTypeResource {

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    CatalogTypeService typeService;

    @Inject
    CatalogItemService itemService;

    @Inject
    CatalogImportExportService importExportService;

    @GET
    @RequirePermission("catalog:item:read")
    public Response list() {
        List<TypeResponse> items = typeService.list(guard.context().tenantId());
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_TYPE_FETCH_SUCCESS,
            "Catalog types retrieved successfully.", items)).build();
    }

    @POST
    @RequirePermission("catalog:type:manage")
    public Response create(TypeCreateRequest request) {
        TypeResponse data = typeService.create(guard.context().tenantId(), request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            CatalogErrorCode.CATALOG_TYPE_CREATED_SUCCESS,
            "Catalog type created successfully.", data)).build();
    }

    @PUT
    @Path("/{id}")
    @RequirePermission("catalog:type:manage")
    public Response update(@PathParam("id") UUID id, TypeUpdateRequest request) {
        TypeResponse data = typeService.update(guard.context().tenantId(), id, request);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_TYPE_UPDATED_SUCCESS,
            "Catalog type updated successfully.", data)).build();
    }

    @GET
    @Path("/{code}/grants")
    @RequirePermission("catalog:type:manage")
    public Response grants(@PathParam("code") String code) {
        List<GrantResponse> items = typeService.grants(guard.context().tenantId(), code);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_GRANT_FETCH_SUCCESS,
            "Catalog type grants retrieved successfully.", items)).build();
    }

    @PUT
    @Path("/{code}/grants")
    @RequirePermission("catalog:type:manage")
    public Response replaceGrants(@PathParam("code") String code, GrantReplaceRequest request) {
        List<GrantResponse> items = typeService.replaceGrants(guard.context().tenantId(), code, request);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_GRANT_UPDATED_SUCCESS,
            "Catalog type grants updated successfully.", items)).build();
    }

    // ------------------------------------------------------------------
    // Items scoped to one type (DES-API section 3, path /types/{code}/items).
    // Kept in this class so no class-level path is a prefix of another class:
    // the Quarkus REST router resolves the longest class root first and does not
    // fall back across classes.
    // ------------------------------------------------------------------

    @GET
    @Path("/{code}/items")
    @RequirePermission("catalog:item:read")
    public Response listItems(@PathParam("code") String code,
                              @QueryParam("q") String q,
                              @QueryParam("parent_id") String parentId,
                              @QueryParam("relation_type") String relationType,
                              @QueryParam("as_of") String asOf,
                              @QueryParam("status") String status,
                              @QueryParam("page") @DefaultValue("0") int page,
                              @QueryParam("size") @DefaultValue("20") int size) {
        UUID tenantId = guard.context().tenantId();
        List<ItemResponse> items = itemService.list(tenantId, code, q, parentId, relationType, asOf, status,
            page, size);
        long total = itemService.count(tenantId, code, q, parentId, relationType, asOf, status);
        return Response.ok(ApiResponse.successPaged(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "Catalog items retrieved successfully.", items, Math.max(page, 0),
            CatalogSupport.size(size), total)).build();
    }

    @POST
    @Path("/{code}/items")
    @RequirePermission("catalog:item:manage")
    public Response createItem(@PathParam("code") String code, ItemCreateRequest request) {
        ItemResponse data = itemService.create(guard.context().tenantId(), code, request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            CatalogErrorCode.CATALOG_ITEM_CREATED_SUCCESS,
            "Catalog item created successfully.", data)).build();
    }

    // ------------------------------------------------------------------
    // Import / export (DES-API section 4.1). The import/template endpoints live
    // here (root /api/v1/catalog/types) because RESTEasy Reactive matches the
    // longest class root first and does not fall back across classes; the export
    // endpoint lives in CatalogImportExportResource (/api/v1/catalog/export).
    // ------------------------------------------------------------------

    @POST
    @Path("/{code}/import")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RequirePermission("catalog:item:manage")
    public Response importItems(@PathParam("code") String code,
                                @QueryParam("dry_run") @DefaultValue("false") boolean dryRun,
                                @RestForm("file") FileUpload file) throws IOException {
        if (file == null) {
            throw new ApiException(400, CatalogErrorCode.CATALOG_IMPORT_VALIDATION_FAILED,
                "The import file is required", Map.of(ResponseKey.FIELD.getKey(), "file"));
        }
        ImportReport data;
        try (InputStream content = Files.newInputStream(file.uploadedFile())) {
            data = importExportService.importItems(guard.context().tenantId(), code, file.fileName(), content,
                dryRun);
        }
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_IMPORT_SUCCESS,
            dryRun ? "Catalog import validated successfully." : "Catalog import processed successfully.",
            data)).build();
    }

    @GET
    @Path("/{code}/import/template")
    @Produces("text/csv; charset=UTF-8")
    @RequirePermission("catalog:item:read")
    public Response importTemplate(@PathParam("code") String code) {
        CsvFile file = importExportService.template(guard.context().tenantId(), code);
        return Response.ok(file.content())
            .type("text/csv; charset=UTF-8")
            .header("Content-Disposition", "attachment; filename=\"" + file.filename() + "\"")
            .build();
    }
}
