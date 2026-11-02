package com.vn9melody.openerp.plugins.employee.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.BootstrapResult;
import com.vn9melody.openerp.plugins.employee.service.EmployeeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * Root-level tenant bootstrap (PluginTenantBootstrapService contract:
 * POST {container}/internal/tenant/bootstrap with a service identity).
 * The service identity carries no user — permission enforcement is the
 * service-token check itself.
 */
@Path("/internal/tenant/bootstrap")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmployeeBootstrapResource {

    @Inject
    EmployeeService employeeService;

    @POST
    public ApiResponse<BootstrapResult> bootstrap() {
        return ApiResponse.success(
            com.vn9melody.openerp.plugins.employee.api.EmployeeErrorCode.EMPLOYEE_BOOTSTRAP_SUCCESS,
            "Employee defaults provisioned.", employeeService.bootstrap());
    }
}
