package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.api.PagedData;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.platform.service.PluginCatalogService;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

/**
 * Platform plugin catalog (FEAT-20 + P1 Sprint 03).
 *
 * <p>Legacy mode keeps the Sprint 02 contract
 * {@code data.items = [{key, name_key, description_key, is_core}]} for the tenant
 * quota drawer. Paginated mode (BUG-94) activates when any of
 * {@code page/size/q/keyword/catalog_status} is present and returns the standard
 * Paginated List envelope with Sprint 03 catalog items.</p>
 */
@Path("/api/v1/platform/plugins")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformPluginResource extends BasePlatformResource {

    @Inject
    PluginCatalogService pluginCatalogService;

    @Inject
    PluginAdminService pluginAdminService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @GET
    public Response list(@QueryParam("page") Integer page,
                         @QueryParam("size") Integer size,
                         @QueryParam("keyword") String keyword,
                         @QueryParam("q") String q,
                         @QueryParam("catalog_status") String catalogStatus) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                "Only super administrators can read the plugin catalog");
        }
        String search = keyword != null && !keyword.isBlank() ? keyword : q;
        if (page == null && size == null && (search == null || search.isBlank())
                && (catalogStatus == null || catalogStatus.isBlank())) {
            List<PlatformResponses.PluginItem> items = pluginCatalogService.listPlugins();
            return Response.ok(ApiResponse.successList(PlatformErrorCode.PLATFORM_PLUGIN_LIST_SUCCESS,
                "Plugin catalog retrieved successfully.", items)).build();
        }
        PluginCatalogStatus status = null;
        if (catalogStatus != null && !catalogStatus.isBlank()) {
            try {
                status = PluginCatalogStatus.valueOf(catalogStatus.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ApiException(400, ErrorCode.VALIDATION_FAILED,
                    "Unknown catalog_status filter");
            }
        }
        PluginAdminService.CatalogPage result = pluginAdminService.listCatalog(search, status,
            page == null ? 0 : page, size == null ? 20 : size);
        PagedData<PluginResponses.CatalogItem> data =
            PagedData.of(result.items(), result.page(), result.size(), result.totalItems());
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_PLUGIN_LIST_SUCCESS,
            "Plugin catalog retrieved successfully.", data)).build();
    }
}
