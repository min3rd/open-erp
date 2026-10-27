package com.vn9melody.openerp.plugins.catalog.resource;

import com.vn9melody.openerp.plugins.catalog.api.ApiException;
import com.vn9melody.openerp.plugins.catalog.api.ApiResponse;
import com.vn9melody.openerp.plugins.catalog.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogSupport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogImportExportDtos.CsvFile;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogImportExportDtos.ImportReport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.EdgeCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.EdgeResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemParentResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemUpdateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogTypeDtos.TypeUpdateRequest;
import com.vn9melody.openerp.plugins.catalog.service.CatalogEdgeService;
import com.vn9melody.openerp.plugins.catalog.service.CatalogImportExportService;
import com.vn9melody.openerp.plugins.catalog.service.CatalogItemService;
import com.vn9melody.openerp.plugins.catalog.service.CatalogTypeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
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
 * Platform administration of the system catalogue ({@code tenant_id IS NULL}
 * rows, TASK-392) on the catalog API surface the admin UI consumes
 * ({@code /api/v1/catalog/system/**}).
 *
 * <p>{@code PlatformRoleRequiredFilter} guards this prefix: only platform-admin
 * tokens pass (role + scope + active session); tenant callers get 403
 * {@code PLATFORM_ACCESS_DENIED}. Platform authorization is role-based, not
 * RBAC, so {@code catalog:system:manage} is declared for documentation only.</p>
 */
@Path("/api/v1/catalog/system")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequirePermission("catalog:system:manage")
public class PlatformCatalogResource {

    @Inject
    CatalogTypeService typeService;

    @Inject
    CatalogItemService itemService;

    @Inject
    CatalogEdgeService edgeService;

    @Inject
    CatalogImportExportService importExportService;

    // ------------------------------------------------------------------
    // Types
    // ------------------------------------------------------------------

    @GET
    @Path("/types")
    public Response listTypes() {
        List<TypeResponse> items = typeService.listSystem();
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_TYPE_FETCH_SUCCESS,
            "System catalog types retrieved successfully.", items)).build();
    }

    @POST
    @Path("/types")
    public Response createType(TypeCreateRequest request) {
        TypeResponse data = typeService.create(null, request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            CatalogErrorCode.CATALOG_TYPE_CREATED_SUCCESS,
            "System catalog type created successfully.", data)).build();
    }

    @PUT
    @Path("/types/{id}")
    public Response updateType(@PathParam("id") UUID id, TypeUpdateRequest request) {
        TypeResponse data = typeService.update(null, id, request);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_TYPE_UPDATED_SUCCESS,
            "System catalog type updated successfully.", data)).build();
    }

    // ------------------------------------------------------------------
    // Items
    // ------------------------------------------------------------------

    @GET
    @Path("/types/{code}/items")
    public Response listItems(@PathParam("code") String code,
                              @QueryParam("q") String q,
                              @QueryParam("parent_id") String parentId,
                              @QueryParam("relation_type") String relationType,
                              @QueryParam("as_of") String asOf,
                              @QueryParam("status") String status,
                              @QueryParam("page") @DefaultValue("0") int page,
                              @QueryParam("size") @DefaultValue("20") int size) {
        List<ItemResponse> items = itemService.list(null, code, q, parentId, relationType, asOf, status, page, size);
        long total = itemService.count(null, code, q, parentId, relationType, asOf, status);
        return Response.ok(ApiResponse.successPaged(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "System catalog items retrieved successfully.", items, Math.max(page, 0),
            CatalogSupport.size(size), total)).build();
    }

    @POST
    @Path("/types/{code}/items")
    public Response createItem(@PathParam("code") String code, ItemCreateRequest request) {
        ItemResponse data = itemService.create(null, code, request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            CatalogErrorCode.CATALOG_ITEM_CREATED_SUCCESS,
            "System catalog item created successfully.", data)).build();
    }

    @GET
    @Path("/items/{id}")
    public Response getItem(@PathParam("id") UUID id,
                            @QueryParam("as_of") String asOf,
                            @QueryParam("with_relations") @DefaultValue("false") boolean withRelations) {
        ItemResponse data = itemService.get(null, id, asOf, withRelations);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "System catalog item retrieved successfully.", data)).build();
    }

    @PUT
    @Path("/items/{id}")
    public Response updateItem(@PathParam("id") UUID id, ItemUpdateRequest request) {
        ItemResponse data = itemService.update(null, id, request);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_ITEM_UPDATED_SUCCESS,
            "System catalog item updated successfully.", data)).build();
    }

    @DELETE
    @Path("/items/{id}")
    public Response closeItem(@PathParam("id") UUID id) {
        itemService.close(null, id);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_ITEM_CLOSED_SUCCESS,
            "System catalog item closed successfully.", null)).build();
    }

    @GET
    @Path("/items/{id}/versions")
    public Response versions(@PathParam("id") UUID id) {
        List<ItemResponse> items = itemService.versions(null, id);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "System catalog item versions retrieved successfully.", items)).build();
    }

    @GET
    @Path("/items/{id}/parents")
    public Response parents(@PathParam("id") UUID id, @QueryParam("as_of") String asOf) {
        List<ItemParentResponse> items = itemService.parents(null, id, asOf);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "System catalog item parents retrieved successfully.", items)).build();
    }

    @GET
    @Path("/items/{id}/descendants")
    public Response descendants(@PathParam("id") UUID id,
                                @QueryParam("as_of") String asOf,
                                @QueryParam("depth") Integer depth) {
        List<ItemResponse> items = itemService.descendants(null, id, asOf, depth);
        return Response.ok(ApiResponse.successList(CatalogErrorCode.CATALOG_ITEM_FETCH_SUCCESS,
            "System catalog item descendants retrieved successfully.", items)).build();
    }

    // ------------------------------------------------------------------
    // Edges
    // ------------------------------------------------------------------

    @POST
    @Path("/edges")
    public Response createEdge(EdgeCreateRequest request) {
        EdgeResponse data = edgeService.create(null, request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            CatalogErrorCode.CATALOG_EDGE_CREATED_SUCCESS,
            "System catalog edge created successfully.", data)).build();
    }

    @DELETE
    @Path("/edges/{id}")
    public Response closeEdge(@PathParam("id") UUID id) {
        edgeService.close(null, id);
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_EDGE_CLOSED_SUCCESS,
            "System catalog edge closed successfully.", null)).build();
    }

    // ------------------------------------------------------------------
    // Import / export (DES-API section 4.1, platform scope: tenant_id IS NULL).
    // PlatformRoleRequiredFilter guards the whole /api/v1/catalog/system prefix.
    // ------------------------------------------------------------------

    @POST
    @Path("/types/{code}/import")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response importItems(@PathParam("code") String code,
                                @QueryParam("dry_run") @DefaultValue("false") boolean dryRun,
                                @RestForm("file") FileUpload file) throws IOException {
        if (file == null) {
            throw new ApiException(400, CatalogErrorCode.CATALOG_IMPORT_VALIDATION_FAILED,
                "The import file is required", Map.of(ResponseKey.FIELD.getKey(), "file"));
        }
        ImportReport data;
        try (InputStream content = Files.newInputStream(file.uploadedFile())) {
            data = importExportService.importItems(null, code, file.fileName(), content, dryRun);
        }
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_IMPORT_SUCCESS,
            dryRun ? "System catalog import validated successfully."
                : "System catalog import processed successfully.",
            data)).build();
    }

    @GET
    @Path("/types/{code}/import/template")
    @Produces("text/csv; charset=UTF-8")
    public Response importTemplate(@PathParam("code") String code) {
        CsvFile file = importExportService.template(null, code);
        return Response.ok(file.content())
            .type("text/csv; charset=UTF-8")
            .header("Content-Disposition", "attachment; filename=\"" + file.filename() + "\"")
            .build();
    }

    @GET
    @Path("/export")
    @Produces("text/csv; charset=UTF-8")
    public Response export(@QueryParam("type_code") String typeCode,
                           @QueryParam("all") @DefaultValue("false") boolean all,
                           @QueryParam("as_of") String asOf,
                           @QueryParam("q") String q,
                           @QueryParam("status") String status,
                           @QueryParam("parent_id") String parentId,
                           @QueryParam("relation_type") String relationType) {
        CsvFile file = importExportService.export(null, typeCode, all, asOf, q, status, parentId, relationType);
        return Response.ok(file.content())
            .type("text/csv; charset=UTF-8")
            .header("Content-Disposition", "attachment; filename=\"" + file.filename() + "\"")
            .build();
    }
}
