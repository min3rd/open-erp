package com.vn9melody.openerp.modules.catalog.resource;

import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.catalog.dto.CatalogImportExportDtos.CsvFile;
import com.vn9melody.openerp.modules.catalog.service.CatalogImportExportService;
import com.vn9melody.openerp.modules.catalog.service.CatalogPermissionGuard;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;

/**
 * CSV export of the catalog surface (DES-API-S05-001 section 4.1, TASK-390):
 * {@code GET /api/v1/catalog/export} honours the same filters as the item list
 * endpoint ({@code type_code} or {@code all=true}, {@code as_of}, {@code q},
 * {@code status}, {@code parent_id}, {@code relation_type}).
 *
 * <p>The class root is the full endpoint path on purpose: RESTEasy Reactive
 * resolves the longest class root first and does not fall back across classes, so
 * a root of {@code /api/v1/catalog} would shadow the existing
 * {@code /api/v1/catalog/types/**} resources. Import/template live in
 * {@link CatalogTypeResource} for the same reason; the platform copies live in
 * {@link PlatformCatalogResource}.</p>
 */
@Path("/api/v1/catalog/export")
public class CatalogImportExportResource {

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    CatalogImportExportService importExportService;

    @GET
    @Produces("text/csv; charset=UTF-8")
    @RequirePermission("catalog:item:read")
    public Response export(@QueryParam("type_code") String typeCode,
                           @QueryParam("all") @DefaultValue("false") boolean all,
                           @QueryParam("as_of") String asOf,
                           @QueryParam("q") String q,
                           @QueryParam("status") String status,
                           @QueryParam("parent_id") String parentId,
                           @QueryParam("relation_type") String relationType) {
        CsvFile file = importExportService.export(guard.context().tenantId(), typeCode, all, asOf, q, status,
            parentId, relationType);
        return Response.ok(file.content())
            .type("text/csv; charset=UTF-8")
            .header("Content-Disposition", "attachment; filename=\"" + file.filename() + "\"")
            .build();
    }
}
