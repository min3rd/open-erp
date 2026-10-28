package com.vn9melody.openerp.plugins.catalog.resource;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.PlatformSyncRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.SyncApplyRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.SyncApplyResult;
import com.vn9melody.openerp.plugins.catalog.service.CatalogSyncService;
import com.vn9melody.openerp.plugins.catalog.service.SystemCatalogSyncService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Internal fan-out endpoints (ADR-S05-001 A6.3). The core plugin manager is the
 * only caller; a shared token protects the path when configured.
 */
@Path("/internal/system-catalog")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SystemCatalogSyncResource {

    @Inject
    SystemCatalogSyncService syncService;

    @Inject
    CatalogSyncService catalogSyncService;

    @ConfigProperty(name = "plugin.fanout-token", defaultValue = "")
    String fanoutToken;

    @GET
    @Path("/snapshot")
    public Response snapshot(@HeaderParam("X-Plugin-Fanout-Token") String token) {
        requireToken(token);
        return Response.ok(ApiResponse.success(CatalogErrorCode.SYSTEM_CATALOG_SNAPSHOT_SUCCESS,
            "System catalog snapshot retrieved.", syncService.snapshot())).build();
    }

    @POST
    @Path("/sync")
    public Response sync(@HeaderParam("X-Plugin-Fanout-Token") String token, JsonNode snapshot) {
        requireToken(token);
        return Response.ok(ApiResponse.success(CatalogErrorCode.SYSTEM_CATALOG_SYNC_SUCCESS,
            "System catalog synchronized.", syncService.apply(snapshot))).build();
    }

    @POST
    @Path("/tenant-sync")
    public Response tenantSync(@HeaderParam("X-Plugin-Fanout-Token") String token, PlatformSyncRequest request) {
        requireToken(token);
        if (request == null || request.tenantId() == null || request.code() == null) {
            throw new ApiException(400, CatalogErrorCode.CATALOG_TYPE_SYNC_INVALID,
                "tenant_id and code are required", java.util.Map.of());
        }
        SyncApplyResult data = catalogSyncService.apply(request.tenantId(), request.code(),
            new SyncApplyRequest(request.conflicts()));
        return Response.ok(ApiResponse.success(CatalogErrorCode.CATALOG_TYPE_SYNC_SUCCESS,
            "Tenant catalog synchronized.", data)).build();
    }

    private void requireToken(String token) {
        if (fanoutToken != null && !fanoutToken.isBlank()
            && (token == null || !fanoutToken.equals(token))) {
            throw new ApiException(403, CatalogErrorCode.SYSTEM_CATALOG_FORBIDDEN,
                "Invalid fan-out token", java.util.Map.of());
        }
    }
}
