package com.vn9melody.openerp.modules.iam.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.modules.iam.dto.UserUiPreferencesUpdateRequest;
import com.vn9melody.openerp.modules.iam.dto.response.UserUiPreferencesResponse;
import com.vn9melody.openerp.modules.iam.service.UserUiPreferencesService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Per-user UI preferences (Sprint 04, TASK-369). Scoped to the authenticated
 * user; the client never sends a user id. Any authenticated user may read and
 * update their own preferences, so no functional permission is required.
 */
@Path("/api/v1/account/ui-preferences")
@Produces(MediaType.APPLICATION_JSON)
public class UserUiPreferencesResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    UserUiPreferencesService service;

    @GET
    public Response get() {
        UserSecurityContext context = securityContextService.getCurrentContext();
        UserUiPreferencesResponse data = service.get(context.userId(), context.tenantId());
        return Response.ok(ApiResponse.success(ErrorCode.USER_UI_PREFERENCES_FETCH_SUCCESS,
                "User UI preferences fetched.", data)).build();
    }

    @PUT
    public Response update(@Valid UserUiPreferencesUpdateRequest request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        UserUiPreferencesResponse data = service.update(context.userId(), context.tenantId(), request);
        return Response.ok(ApiResponse.success(ErrorCode.USER_UI_PREFERENCES_UPDATE_SUCCESS,
                "User UI preferences updated.", data)).build();
    }
}
