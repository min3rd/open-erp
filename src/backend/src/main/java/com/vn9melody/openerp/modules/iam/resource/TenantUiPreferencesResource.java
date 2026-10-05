package com.vn9melody.openerp.modules.iam.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.iam.dto.TenantUiPreferencesUpdateRequest;
import com.vn9melody.openerp.modules.iam.dto.response.TenantUiPreferencesResponse;
import com.vn9melody.openerp.modules.iam.service.TenantUiPreferencesService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Tenant workspace UI preferences (Sprint 04, DES-API-S04-001). The theme is
 * scoped to the authenticated tenant; the client never sends a tenant id.
 */
@Path("/api/v1/tenant/ui-preferences")
@Produces(MediaType.APPLICATION_JSON)
public class TenantUiPreferencesResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    TenantUiPreferencesService service;

    @GET
    public Response get() {
        UserSecurityContext context = securityContextService.getCurrentContext();
        TenantUiPreferencesResponse data = service.get(context.tenantId());
        return Response.ok(ApiResponse.success(ErrorCode.TENANT_UI_PREFERENCES_FETCH_SUCCESS,
                "Tenant UI preferences fetched.", data)).build();
    }

    @PUT
    @RequirePermission("core:tenant:settings-manage")
    public Response update(@Valid TenantUiPreferencesUpdateRequest request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        TenantUiPreferencesResponse data = service.update(context.tenantId(), request.theme, context.userId());
        return Response.ok(ApiResponse.success(ErrorCode.TENANT_UI_PREFERENCES_UPDATE_SUCCESS,
                "Tenant UI preferences updated.", data)).build();
    }
}
