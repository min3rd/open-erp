package com.vn9melody.openerp.plugins.organization.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.organization.api.OrganizationErrorCode;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BootstrapResult;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BranchAccessRequest;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BranchAccessResponse;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BranchRequest;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BranchResponse;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.DepartmentRequest;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.DepartmentResponse;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.MembershipRequest;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.MembershipResponse;
import com.vn9melody.openerp.plugins.organization.service.OrganizationService;
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

import java.util.List;
import java.util.UUID;

@Path("/api/v1/org")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrganizationResource {

    @Inject
    OrganizationService service;

    @Inject
    TenantContext context;

    // ------------------------------------------------------------------ branches

    @GET
    @Path("/branches")
    @RequirePermission("organization:branch:read")
    public ApiResponse<ListData<BranchResponse>> branches() {
        return ApiResponse.successList(
            OrganizationErrorCode.BRANCH_LIST_SUCCESS,
            "Branches retrieved.",
            service.listBranches());
    }

    @POST
    @Path("/branches")
    @RequirePermission("organization:branch:manage")
    public ApiResponse<BranchResponse> createBranch(BranchRequest request) {
        return ApiResponse.success(
            OrganizationErrorCode.BRANCH_CREATED,
            "Branch created.",
            service.createBranch(request));
    }

    @PUT
    @Path("/branches/{id}")
    @RequirePermission("organization:branch:manage")
    public ApiResponse<BranchResponse> updateBranch(@PathParam("id") UUID id, BranchRequest request) {
        return ApiResponse.success(
            "ORGANIZATION_BRANCH_UPDATED",
            "Branch updated.",
            service.updateBranch(id, request));
    }

    @DELETE
    @Path("/branches/{id}")
    @RequirePermission("organization:branch:manage")
    public ApiResponse<BranchResponse> archiveBranch(@PathParam("id") UUID id) {
        return ApiResponse.success(
            OrganizationErrorCode.BRANCH_ARCHIVED,
            "Branch archived.",
            service.archiveBranch(id, null));
    }

    // --------------------------------------------------------------- departments

    @GET
    @Path("/departments")
    @RequirePermission("organization:department:read")
    public ApiResponse<ListData<DepartmentResponse>> departments() {
        return ApiResponse.successList(
            OrganizationErrorCode.DEPARTMENT_LIST_SUCCESS,
            "Departments retrieved.",
            service.listDepartments());
    }

    @POST
    @Path("/departments")
    @RequirePermission("organization:department:manage")
    public ApiResponse<DepartmentResponse> createDepartment(DepartmentRequest request) {
        return ApiResponse.success(
            OrganizationErrorCode.DEPARTMENT_CREATED,
            "Department created.",
            service.createDepartment(request));
    }

    @PUT
    @Path("/departments/{id}")
    @RequirePermission("organization:department:manage")
    public ApiResponse<DepartmentResponse> updateDepartment(
            @PathParam("id") UUID id, DepartmentRequest request) {
        return ApiResponse.success(
            "ORGANIZATION_DEPARTMENT_UPDATED",
            "Department updated.",
            service.updateDepartment(id, request));
    }

    @DELETE
    @Path("/departments/{id}")
    @RequirePermission("organization:department:manage")
    public ApiResponse<DepartmentResponse> archiveDepartment(@PathParam("id") UUID id) {
        return ApiResponse.success(
            OrganizationErrorCode.DEPARTMENT_ARCHIVED,
            "Department archived.",
            service.archiveDepartment(id, null));
    }

    // ---------------------------------------------------------------- memberships

    @GET
    @Path("/memberships")
    @RequirePermission("organization:membership:read")
    public ApiResponse<ListData<MembershipResponse>> memberships(
            @QueryParam("user_id") UUID userId,
            @QueryParam("all") @DefaultValue("false") boolean all) {
        if (all) {
            return ApiResponse.successList(
                OrganizationErrorCode.MEMBERSHIP_LIST_SUCCESS,
                "Memberships retrieved.",
                service.listAllMemberships());
        }
        UUID target = userId != null ? userId : context.userId();
        if (target == null) {
            return ApiResponse.successList(
                OrganizationErrorCode.MEMBERSHIP_LIST_SUCCESS,
                "Memberships retrieved.",
                List.of());
        }
        return ApiResponse.successList(
            OrganizationErrorCode.MEMBERSHIP_LIST_SUCCESS,
            "Memberships retrieved.",
            service.listMemberships(target));
    }

    @POST
    @Path("/memberships")
    @RequirePermission("organization:membership:manage")
    public ApiResponse<MembershipResponse> createMembership(MembershipRequest request) {
        return ApiResponse.success(
            OrganizationErrorCode.MEMBERSHIP_CREATED,
            "Membership created.",
            service.createMembership(request));
    }

    @PUT
    @Path("/memberships/{id}")
    @RequirePermission("organization:membership:manage")
    public ApiResponse<MembershipResponse> updateMembership(
            @PathParam("id") UUID id, MembershipRequest request) {
        return ApiResponse.success(
            "ORGANIZATION_MEMBERSHIP_UPDATED",
            "Membership updated.",
            service.updateMembership(id, request));
    }

    @DELETE
    @Path("/memberships/{id}")
    @RequirePermission("organization:membership:manage")
    public ApiResponse<Void> deleteMembership(@PathParam("id") UUID id) {
        service.deleteMembership(id);
        return ApiResponse.success(
            OrganizationErrorCode.MEMBERSHIP_DELETED,
            "Membership deleted.",
            null);
    }

    // --------------------------------------------------------------- branch access

    @GET
    @Path("/branch-access")
    @RequirePermission("organization:branch-access:read")
    public ApiResponse<ListData<BranchAccessResponse>> branchAccess(
            @QueryParam("user_id") UUID userId,
            @QueryParam("all") @DefaultValue("false") boolean all) {
        if (all) {
            return ApiResponse.successList(
                OrganizationErrorCode.BRANCH_ACCESS_LIST_SUCCESS,
                "Branch access retrieved.",
                service.listAllBranchAccess());
        }
        UUID target = userId != null ? userId : context.userId();
        return ApiResponse.successList(
            OrganizationErrorCode.BRANCH_ACCESS_LIST_SUCCESS,
            "Branch access retrieved.",
            target == null ? List.of() : service.listBranchAccess(target));
    }

    @POST
    @Path("/branch-access")
    @RequirePermission("organization:branch-access:manage")
    public ApiResponse<BranchAccessResponse> createBranchAccess(BranchAccessRequest request) {
        return ApiResponse.success(
            OrganizationErrorCode.BRANCH_ACCESS_SAVED,
            "Branch access created.",
            service.createBranchAccess(request));
    }

    @PUT
    @Path("/branch-access/{id}")
    @RequirePermission("organization:branch-access:manage")
    public ApiResponse<BranchAccessResponse> updateBranchAccess(
            @PathParam("id") UUID id, BranchAccessRequest request) {
        return ApiResponse.success(
            OrganizationErrorCode.BRANCH_ACCESS_SAVED,
            "Branch access updated.",
            service.updateBranchAccess(id, request));
    }

    @DELETE
    @Path("/branch-access/{id}")
    @RequirePermission("organization:branch-access:manage")
    public ApiResponse<Void> deleteBranchAccess(@PathParam("id") UUID id) {
        service.deleteBranchAccess(id);
        return ApiResponse.success(
            OrganizationErrorCode.BRANCH_ACCESS_DELETED,
            "Branch access deleted.",
            null);
    }

    // ----------------------------------------------------------------- internal

    @POST
    @Path("/internal/bootstrap")
    @RequirePermission("organization:org:manage")
    public ApiResponse<BootstrapResult> bootstrap() {
        return ApiResponse.success(
            OrganizationErrorCode.BOOTSTRAP_SUCCESS,
            "Organization defaults provisioned.",
            service.bootstrap());
    }
}
