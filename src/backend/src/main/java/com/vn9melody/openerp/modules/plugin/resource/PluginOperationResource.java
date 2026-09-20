package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginOperationLog;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginOperationLogRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Shared operation status API (DES-03-API section 5.2, TASK-312): reads the
 * append-only saga trail for an operation id scoped to the caller tenant.
 */
@Path("/api/v1/plugins/operations")
@Produces(MediaType.APPLICATION_JSON)
public class PluginOperationResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    PluginOperationLogRepository operationLogRepository;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @GET
    @Path("/{operationId}")
    public Response status(@PathParam("operationId") String operationId) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        UUID id;
        try {
            id = UUID.fromString(operationId);
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_NOT_FOUND, "Invalid operation id");
        }
        List<PluginOperationLog> logs = operationLogRepository.listByOperation(id);
        if (logs.isEmpty()) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Operation not found");
        }
        PluginOperationLog first = logs.get(0);
        if (first.tenantId != null && !first.tenantId.equals(context.tenantId())) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_NOT_ENTITLED, "Operation belongs to another tenant");
        }
        PluginResponses.OperationStatus status = new PluginResponses.OperationStatus();
        status.operationId = id.toString();
        status.pluginKey = first.pluginKey;
        status.operation = first.operation;
        TenantPlugin ledger = tenantPluginRepository
                .findByTenantAndKey(context.tenantId(), first.pluginKey)
                .orElse(null);
        status.status = ledger != null ? ledger.status.name() : null;
        status.targetVersion = ledger != null ? ledger.installedVersion : null;
        List<PluginResponses.OperationStep> steps = new ArrayList<>();
        for (PluginOperationLog entry : logs) {
            PluginResponses.OperationStep step = new PluginResponses.OperationStep();
            step.step = entry.step;
            step.result = entry.result;
            if ("FAILED".equals(entry.result) && entry.detail != null) {
                step.errorCode = entry.detail.path("error_code").asText(null);
            }
            steps.add(step);
        }
        status.steps = steps;
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_OPERATION_STATUS_SUCCESS,
                "Operation status retrieved successfully.", status)).build();
    }
}
