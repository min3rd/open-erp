package com.vn9melody.openerp.plugins.employee.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.employee.api.EmployeeErrorCode;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ApprovalConfigRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ApprovalConfigResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ApprovalRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.AssignmentRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.AssignmentResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.BootstrapResult;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.CampaignCreateRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.CampaignRecipientResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.CampaignResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ChangeRequestCreateRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ChangeRequestResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ConsentRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ConsentResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ContractRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ContractResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.DirectoryResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.DocumentRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.SignedUrlResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.DocumentResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.EmployeeRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.EmployeeResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.FieldConfigResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.FieldConfigUpdateRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ImportRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ImportResult;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.LinkUserRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OffboardRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OnboardingInviteRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OnboardingInviteResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OnboardingSubmitResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OrgChartNode;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.PrivacyExportResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.PrivacyRequestCreateRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.PrivacyRequestResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.RejectionRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ReportingRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ReportingResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ScanResultRequest;
import com.vn9melody.openerp.plugins.employee.model.StoredDocument;
import com.vn9melody.openerp.plugins.employee.service.EmployeeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.server.multipart.FormValue;
import org.jboss.resteasy.reactive.server.multipart.MultipartFormDataInput;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Path("/api/v1/employee")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmployeeResource {

    @Inject
    EmployeeService service;

    @Inject
    TenantContext context;

    private Set<UUID> branchScope() {
        if (context.platform() || context.roleCodes().contains("TENANT_ADMIN")) {
            return null;
        }
        return context.branchIds();
    }

    // ------------------------------------------------------------------ profiles

    @GET
    @Path("/employees")
    @RequirePermission("employee:profile:read")
    public ApiResponse<PagedData<EmployeeResponse>> employees(
            @QueryParam("q") String q,
            @QueryParam("branch_id") UUID branchId,
            @QueryParam("department_id") UUID departmentId,
            @QueryParam("status") String status,
            @QueryParam("employee_type") String employeeType,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_LIST_SUCCESS,
            "Employees retrieved.",
            service.listEmployees(q, branchId, departmentId, status, employeeType, page, size, branchScope()));
    }

    @POST
    @Path("/employees")
    @RequirePermission("employee:profile:create")
    public ApiResponse<EmployeeResponse> createEmployee(EmployeeRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CREATED,
            "Employee created.", service.createEmployee(request));
    }

    @GET
    @Path("/employees/export")
    @Produces("text/csv")
    @RequirePermission("employee:profile:read")
    public Response exportEmployees() {
        StringBuilder csv = new StringBuilder(
            "employee_code,full_name,status,employee_type,work_email,phone,date_of_birth\n");
        for (EmployeeResponse item : service.exportEmployees()) {
            csv.append(csv(item.employeeCode())).append(',')
                .append(csv(item.fullName())).append(',')
                .append(csv(item.status())).append(',')
                .append(csv(item.employeeType())).append(',')
                .append(csv(item.workEmail())).append(',')
                .append(csv(item.phone())).append(',')
                .append(csv(item.dateOfBirth() == null ? null : item.dateOfBirth().toString()))
                .append('\n');
        }
        return Response.ok(csv.toString())
            .type("text/csv; charset=utf-8")
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"employees.csv\"")
            .build();
    }

    @POST
    @Path("/employees/import")
    @RequirePermission("employee:profile:create")
    public ApiResponse<ImportResult> importEmployees(ImportRequest request) {
        return ApiResponse.success("EMPLOYEE_IMPORT_COMPLETED",
            "Employee import completed.", service.importEmployees(request));
    }

    @GET
    @Path("/employees/{id}")
    @RequirePermission("employee:profile:read")
    public ApiResponse<EmployeeResponse> employee(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_RETRIEVED,
            "Employee retrieved.", service.getEmployee(id));
    }

    @PUT
    @Path("/employees/{id}")
    @RequirePermission("employee:profile:update")
    public ApiResponse<EmployeeResponse> updateEmployee(@PathParam("id") UUID id, EmployeeRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_UPDATED,
            "Employee updated.", service.updateEmployee(id, request));
    }

    @POST
    @Path("/employees/{id}/link-user")
    @RequirePermission("employee:profile:update")
    public ApiResponse<EmployeeResponse> linkUser(@PathParam("id") UUID id, LinkUserRequest request) {
        return ApiResponse.success("EMPLOYEE_USER_LINKED",
            "Employee linked to user.",
            service.linkUser(id, request == null ? null : request.userId()));
    }

    @POST
    @Path("/employees/{id}/unlink-user")
    @RequirePermission("employee:profile:update")
    public ApiResponse<EmployeeResponse> unlinkUser(@PathParam("id") UUID id) {
        return ApiResponse.success("EMPLOYEE_USER_UNLINKED",
            "Employee unlinked from user.", service.unlinkUser(id));
    }

    @POST
    @Path("/employees/{id}/offboard")
    @RequirePermission("employee:profile:archive")
    public ApiResponse<EmployeeResponse> offboard(@PathParam("id") UUID id, OffboardRequest request) {
        return ApiResponse.success("EMPLOYEE_OFFBOARDED",
            "Employee offboarded.", service.offboard(id, request));
    }

    // --------------------------------------------------------------- assignments

    @GET
    @Path("/employees/{id}/assignments")
    @RequirePermission("employee:profile:read")
    public ApiResponse<ListData<AssignmentResponse>> assignments(@PathParam("id") UUID id) {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_LIST_SUCCESS,
            "Assignments retrieved.", service.listAssignments(id));
    }

    @POST
    @Path("/employees/{id}/assignments")
    @RequirePermission("employee:assignment:manage")
    public ApiResponse<AssignmentResponse> createAssignment(@PathParam("id") UUID id,
                                                            AssignmentRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_CREATED,
            "Assignment created.", service.createAssignment(id, request));
    }

    // ---------------------------------------------------------------- contracts

    @GET
    @Path("/employees/{id}/contracts")
    @RequirePermission("employee:profile:read")
    public ApiResponse<ListData<ContractResponse>> contracts(@PathParam("id") UUID id) {
        return ApiResponse.successList("EMPLOYEE_CONTRACT_LIST_SUCCESS",
            "Contracts retrieved.", service.listContracts(id));
    }

    @POST
    @Path("/employees/{id}/contracts")
    @RequirePermission("employee:contract:manage")
    public ApiResponse<ContractResponse> createContract(@PathParam("id") UUID id, ContractRequest request) {
        return ApiResponse.success("EMPLOYEE_CONTRACT_CREATED",
            "Contract created.", service.createContract(id, request));
    }

    @PUT
    @Path("/contracts/{id}")
    @RequirePermission("employee:contract:manage")
    public ApiResponse<ContractResponse> updateContract(@PathParam("id") UUID id, ContractRequest request) {
        return ApiResponse.success("EMPLOYEE_CONTRACT_UPDATED",
            "Contract updated.", service.updateContract(id, request));
    }

    // -------------------------------------------------------------- reporting

    @GET
    @Path("/employees/{id}/reporting-relationships")
    @RequirePermission("employee:profile:read")
    public ApiResponse<ListData<ReportingResponse>> reporting(@PathParam("id") UUID id) {
        return ApiResponse.successList("EMPLOYEE_REPORTING_LIST_SUCCESS",
            "Reporting relationships retrieved.", service.listReporting(id));
    }

    @POST
    @Path("/employees/{id}/reporting-relationships")
    @RequirePermission("employee:reporting:manage")
    public ApiResponse<ReportingResponse> createReporting(@PathParam("id") UUID id, ReportingRequest request) {
        return ApiResponse.success("EMPLOYEE_REPORTING_CREATED",
            "Reporting relationship created.", service.createReporting(id, request));
    }

    @DELETE
    @Path("/reporting-relationships/{id}")
    @RequirePermission("employee:reporting:manage")
    public ApiResponse<Void> deleteReporting(@PathParam("id") UUID id) {
        service.deleteReporting(id);
        return ApiResponse.success("EMPLOYEE_REPORTING_DELETED",
            "Reporting relationship deleted.", null);
    }

    // -------------------------------------------------------------- self-service

    @GET
    @Path("/me")
    @RequirePermission("employee:self:read")
    public ApiResponse<EmployeeResponse> me() {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_SELF_RETRIEVED,
            "Employee profile retrieved.", service.getSelf());
    }

    @PATCH
    @Path("/me")
    @RequirePermission("employee:self:update")
    public ApiResponse<EmployeeResponse> updateMe(Map<String, Object> request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_SELF_UPDATED,
            "Employee profile updated.", service.updateSelf(request));
    }

    @GET
    @Path("/me/change-requests")
    @RequirePermission("employee:self:read")
    public ApiResponse<PagedData<ChangeRequestResponse>> myChangeRequests(
            @QueryParam("status") String status,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_LIST_SUCCESS,
            "Change requests retrieved.",
            service.listSelfChangeRequests(status, page, size));
    }

    @POST
    @Path("/me/change-requests")
    @RequirePermission("employee:self:update")
    public ApiResponse<ChangeRequestResponse> createMyChangeRequest(Map<String, Object> request) {
        Object changes = request == null ? null : request.get("changes");
        @SuppressWarnings("unchecked")
        Map<String, Object> rawChanges = changes instanceof Map<?, ?> map
            ? (Map<String, Object>) map
            : null;
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_CREATED,
            "Change request created.", service.createSelfChangeRequest(rawChanges));
    }

    @POST
    @Path("/me/change-requests/{id}/withdraw")
    @RequirePermission("employee:self:update")
    public ApiResponse<ChangeRequestResponse> withdrawMyChangeRequest(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_WITHDRAWN,
            "Change request withdrawn.", service.withdrawSelfChangeRequest(id));
    }

    // ----------------------------------------------------------- change requests

    @GET
    @Path("/change-requests")
    @RequirePermission("employee:change-request:read")
    public ApiResponse<PagedData<ChangeRequestResponse>> changeRequests(
            @QueryParam("status") String status,
            @QueryParam("employee_id") UUID employeeId,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_LIST_SUCCESS,
            "Change requests retrieved.",
            service.listChangeRequests(status, employeeId, page, size));
    }

    @GET
    @Path("/change-requests/{id}")
    @RequirePermission("employee:change-request:read")
    public ApiResponse<ChangeRequestResponse> changeRequest(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_RETRIEVED,
            "Change request retrieved.", service.getChangeRequest(id));
    }

    @POST
    @Path("/change-requests")
    @RequirePermission("employee:profile:update")
    public ApiResponse<ChangeRequestResponse> createChangeRequest(ChangeRequestCreateRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_CREATED,
            "Change request created.", service.createChangeRequest(request));
    }

    @POST
    @Path("/change-requests/{id}/approve")
    @RequirePermission("employee:change-request:approve")
    public ApiResponse<ChangeRequestResponse> approve(@PathParam("id") UUID id, ApprovalRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_APPROVED,
            "Change request approved.", service.approveChangeRequest(id, request));
    }

    @POST
    @Path("/change-requests/{id}/reject")
    @RequirePermission("employee:change-request:approve")
    public ApiResponse<ChangeRequestResponse> reject(@PathParam("id") UUID id, RejectionRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_REJECTED,
            "Change request rejected.", service.rejectChangeRequest(id, request));
    }

    // -------------------------------------------------------------------- config

    @GET
    @Path("/config/fields")
    @RequirePermission("employee:field-config:manage")
    public ApiResponse<ListData<FieldConfigResponse>> fieldConfigs() {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_FIELD_CONFIG_LIST_SUCCESS,
            "Field configuration retrieved.", service.listFieldConfigs());
    }

    @PUT
    @Path("/config/fields")
    @RequirePermission("employee:field-config:manage")
    public ApiResponse<ListData<FieldConfigResponse>> updateFieldConfigs(
            List<FieldConfigUpdateRequest> request) {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_FIELD_CONFIG_UPDATED,
            "Field configuration updated.", service.updateFieldConfigs(request));
    }

    @POST
    @Path("/config/fields/bootstrap")
    @RequirePermission("employee:field-config:manage")
    public ApiResponse<BootstrapResult> bootstrapFieldConfigs() {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_BOOTSTRAP_SUCCESS,
            "Employee defaults provisioned.", service.bootstrap());
    }

    @GET
    @Path("/config/approvals")
    @RequirePermission("employee:approval-config:manage")
    public ApiResponse<ListData<ApprovalConfigResponse>> approvalConfigs() {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_APPROVAL_CONFIG_LIST_SUCCESS,
            "Approval configuration retrieved.", service.listApprovalConfigs());
    }

    @PUT
    @Path("/config/approvals")
    @RequirePermission("employee:approval-config:manage")
    public ApiResponse<ListData<ApprovalConfigResponse>> updateApprovalConfigs(
            List<ApprovalConfigRequest> request) {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_APPROVAL_CONFIG_UPDATED,
            "Approval configuration updated.", service.upsertApprovalConfigs(request));
    }

    @DELETE
    @Path("/config/approvals/{id}")
    @RequirePermission("employee:approval-config:manage")
    public ApiResponse<Void> deleteApprovalConfig(@PathParam("id") UUID id) {
        service.deleteApprovalConfig(id);
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_APPROVAL_CONFIG_DELETED,
            "Approval configuration deleted.", null);
    }

    // -------------------------------------------------------------- onboarding

    @POST
    @Path("/onboarding-invites")
    @RequirePermission("employee:onboarding:manage")
    public ApiResponse<OnboardingInviteResponse> createOnboardingInvite(
            OnboardingInviteRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_ONBOARDING_INVITE_CREATED,
            "Onboarding invite created.", service.createOnboardingInvite(request));
    }

    @GET
    @Path("/onboarding-invites")
    @RequirePermission("employee:onboarding:manage")
    public ApiResponse<PagedData<OnboardingInviteResponse>> onboardingInvites(
            @QueryParam("status") String status,
            @QueryParam("email") String email,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_ONBOARDING_INVITE_LIST_SUCCESS,
            "Onboarding invites retrieved.",
            service.listOnboardingInvites(status, email, page, size));
    }

    @POST
    @Path("/onboarding-invites/{id}/revoke")
    @RequirePermission("employee:onboarding:manage")
    public ApiResponse<OnboardingInviteResponse> revokeOnboardingInvite(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_ONBOARDING_INVITE_REVOKED,
            "Onboarding invite revoked.", service.revokeOnboardingInvite(id));
    }

    /** Public one-time submit; the core gateway supplies tenant context from the invite link. */
    @POST
    @Path("/public/onboarding/{token}")
    public ApiResponse<OnboardingSubmitResponse> submitOnboarding(
            @PathParam("token") String token, Map<String, Object> request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_ONBOARDING_SUBMITTED,
            "Onboarding information submitted.", service.submitOnboarding(token, request));
    }

    // --------------------------------------------------------------- campaigns

    @POST
    @Path("/campaigns")
    @RequirePermission("employee:campaign:manage")
    public ApiResponse<CampaignResponse> createCampaign(CampaignCreateRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CAMPAIGN_CREATED,
            "Campaign created.", service.createCampaign(request));
    }

    @GET
    @Path("/campaigns")
    @RequirePermission("employee:campaign:manage")
    public ApiResponse<PagedData<CampaignResponse>> campaigns(
            @QueryParam("status") String status,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CAMPAIGN_LIST_SUCCESS,
            "Campaigns retrieved.", service.listCampaigns(status, page, size));
    }

    @GET
    @Path("/campaigns/{id}/recipients")
    @RequirePermission("employee:campaign:manage")
    public ApiResponse<PagedData<CampaignRecipientResponse>> campaignRecipients(
            @PathParam("id") UUID id,
            @QueryParam("status") String status,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CAMPAIGN_RECIPIENT_LIST_SUCCESS,
            "Campaign recipients retrieved.",
            service.listCampaignRecipients(id, status, page, size));
    }

    @POST
    @Path("/campaigns/{id}/close")
    @RequirePermission("employee:campaign:manage")
    public ApiResponse<CampaignResponse> closeCampaign(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CAMPAIGN_CLOSED,
            "Campaign closed.", service.closeCampaign(id));
    }

    // ----------------------------------------------------------------- privacy

    @POST
    @Path("/privacy/requests")
    public ApiResponse<PrivacyRequestResponse> createPrivacyRequest(
            PrivacyRequestCreateRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_CREATED,
            "Privacy request created.", service.createPrivacyRequest(request));
    }

    @GET
    @Path("/privacy/requests")
    @RequirePermission("employee:privacy:manage")
    public ApiResponse<PagedData<PrivacyRequestResponse>> privacyRequests(
            @QueryParam("status") String status,
            @QueryParam("employee_id") UUID employeeId,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_LIST_SUCCESS,
            "Privacy requests retrieved.",
            service.listPrivacyRequests(status, employeeId, page, size));
    }

    @POST
    @Path("/privacy/requests/{id}/complete")
    @RequirePermission("employee:privacy:manage")
    public ApiResponse<PrivacyRequestResponse> completePrivacyRequest(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_COMPLETED,
            "Privacy request completed.", service.completePrivacyRequest(id));
    }

    @GET
    @Path("/privacy/requests/{id}/export")
    @RequirePermission("employee:privacy:manage")
    public ApiResponse<PrivacyExportResponse> exportPrivacyRequest(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_PRIVACY_EXPORT_SUCCESS,
            "Privacy request exported.", service.exportPrivacyRequest(id));
    }

    @POST
    @Path("/privacy/requests/{id}/erase")
    @RequirePermission("employee:privacy:manage")
    public ApiResponse<PrivacyRequestResponse> erasePrivacyRequest(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_COMPLETED,
            "Privacy request erased.", service.erasePrivacyRequest(id));
    }

    @GET
    @Path("/privacy/consents")
    public ApiResponse<ListData<ConsentResponse>> consents(
            @QueryParam("employee_id") UUID employeeId,
            @QueryParam("purpose") String purpose) {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_CONSENT_LIST_SUCCESS,
            "Consent state retrieved.", service.listConsents(employeeId, purpose));
    }

    @PUT
    @Path("/privacy/consents")
    public ApiResponse<ConsentResponse> updateConsent(ConsentRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_CONSENT_UPDATED,
            "Consent state updated.", service.upsertConsent(request));
    }

    // ----------------------------------------------------------------- directory

    @GET
    @Path("/directory")
    @RequirePermission("employee:directory:read")
    public ApiResponse<PagedData<DirectoryResponse>> directory(
            @QueryParam("q") String q,
            @QueryParam("status") String status,
            @QueryParam("employee_type") String employeeType,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_DIRECTORY_LIST_SUCCESS,
            "Employee directory retrieved.",
            service.directory(q, status, employeeType, page, size));
    }

    @GET
    @Path("/org-chart")
    @RequirePermission("employee:directory:read")
    public ApiResponse<ListData<OrgChartNode>> orgChart() {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_DIRECTORY_LIST_SUCCESS,
            "Employee org chart retrieved.", service.orgChart());
    }

    // ----------------------------------------------------------------- documents

    @GET
    @Path("/employees/{id}/documents")
    @RequirePermission("employee:document:read")
    public ApiResponse<ListData<DocumentResponse>> documents(@PathParam("id") UUID id) {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_DOCUMENT_LIST_SUCCESS,
            "Documents retrieved.", service.listDocuments(id));
    }

    @POST
    @Path("/employees/{id}/documents")
    @RequirePermission("employee:document:manage")
    public ApiResponse<DocumentResponse> createDocument(@PathParam("id") UUID id, DocumentRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_DOCUMENT_CREATED,
            "Document metadata created.", service.createDocument(id, request));
    }

    @POST
    @Path("/employees/{id}/documents")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RequirePermission("employee:document:manage")
    public ApiResponse<DocumentResponse> uploadDocument(@PathParam("id") UUID id,
                                                        MultipartFormDataInput input) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_DOCUMENT_UPLOADED,
            "Document uploaded.", storeUpload(id, input, false));
    }

    @GET
    @Path("/me/documents")
    @RequirePermission("employee:self:read")
    public ApiResponse<ListData<DocumentResponse>> myDocuments() {
        return ApiResponse.successList(EmployeeErrorCode.EMPLOYEE_DOCUMENT_LIST_SUCCESS,
            "Documents retrieved.", service.listSelfDocuments());
    }

    @POST
    @Path("/me/documents")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RequirePermission("employee:self:update")
    public ApiResponse<DocumentResponse> uploadMyDocument(MultipartFormDataInput input) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_DOCUMENT_UPLOADED,
            "Document uploaded.", storeUpload(null, input, true));
    }

    @GET
    @Path("/me/documents/{id}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @RequirePermission("employee:self:read")
    public Response downloadMyDocument(@PathParam("id") UUID id) {
        StoredDocument document = service.downloadSelfDocument(id);
        String encodedName = URLEncoder.encode(document.fileName(), StandardCharsets.UTF_8)
            .replace("+", "%20");
        return Response.ok(document.file())
            .type(document.mimeType())
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename*=UTF-8''" + encodedName)
            .build();
    }

    private static String csv(String value) {
        if (value == null) {
            return "";
        }
        return '"' + value.replace("\"", "\"\"") + '"';
    }

    private DocumentResponse storeUpload(UUID employeeId, MultipartFormDataInput input, boolean self) {
        FormValue file = firstFile(input);
        byte[] bytes;
        try (InputStream content = file.getFileItem().getInputStream()) {
            bytes = content.readAllBytes();
        } catch (IOException e) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_DOCUMENT_STORAGE_FAILED,
                "Cannot read the uploaded document",
                Map.of("employee_id", String.valueOf(employeeId)));
        }
        String documentType = formValue(input, "document_type");
        String retention = formValue(input, "retention_until");
        String mimeType = formValue(input, "mime_type");
        if (mimeType == null) {
            mimeType = contentType(file);
        }
        if (self) {
            return service.uploadSelfDocument(documentType, file.getFileName(), mimeType, bytes);
        }
        LocalDate retentionUntil = null;
        if (retention != null && !retention.isBlank()) {
            try {
                retentionUntil = LocalDate.parse(retention.trim());
            } catch (DateTimeParseException e) {
                throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                    "retention_until must be an ISO date", Map.of("field", "retention_until"));
            }
        }
        return service.uploadDocument(employeeId, documentType, file.getFileName(), mimeType,
            bytes, retentionUntil);
    }

    @GET
    @Path("/documents/{id}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @RequirePermission("employee:document:read")
    public Response downloadDocument(@PathParam("id") UUID id) {
        StoredDocument document = service.downloadDocument(id);
        String encodedName = URLEncoder.encode(document.fileName(), StandardCharsets.UTF_8)
            .replace("+", "%20");
        return Response.ok(document.file())
            .type(document.mimeType())
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename*=UTF-8''" + encodedName)
            .build();
    }

    /** TASK-433: issues a short-lived pre-signed download URL for an HR-managed document. */
    @POST
    @Path("/documents/{id}/signed-url")
    @RequirePermission("employee:document:read")
    public ApiResponse<SignedUrlResponse> createDocumentSignedUrl(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_DOCUMENT_SIGNED_URL_CREATED,
            "Signed download URL created.", service.createSignedUrl(id, false));
    }

    /** TASK-433: issues a short-lived pre-signed download URL for an own document. */
    @POST
    @Path("/me/documents/{id}/signed-url")
    @RequirePermission("employee:self:read")
    public ApiResponse<SignedUrlResponse> createMyDocumentSignedUrl(@PathParam("id") UUID id) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_DOCUMENT_SIGNED_URL_CREATED,
            "Signed download URL created.", service.createSignedUrl(id, true));
    }

    /** TASK-433: pre-signed download endpoint (no bearer token required, HMAC + TTL verified). */
    @GET
    @Path("/signed-documents/{id}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadSignedDocument(@PathParam("id") UUID id,
                                           @QueryParam("exp") Long expiryEpoch,
                                           @QueryParam("sig") String signature) {
        StoredDocument document = service.downloadSignedDocument(id, expiryEpoch, signature);
        String encodedName = URLEncoder.encode(document.fileName(), StandardCharsets.UTF_8)
            .replace("+", "%20");
        return Response.ok(document.file())
            .type(document.mimeType())
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename*=UTF-8''" + encodedName)
            .build();
    }

    @POST
    @Path("/internal/documents/{id}/scan-result")
    @RequirePermission("employee:document:manage")
    public ApiResponse<DocumentResponse> scanResult(@PathParam("id") UUID id,
                                                    ScanResultRequest request) {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_DOCUMENT_SCAN_UPDATED,
            "Document scan result recorded.", service.updateScanResult(id, request));
    }

    // ----------------------------------------------------------------- internal

    @POST
    @Path("/internal/tenant/bootstrap")
    @RequirePermission("employee:field-config:manage")
    public ApiResponse<BootstrapResult> bootstrap() {
        return ApiResponse.success(EmployeeErrorCode.EMPLOYEE_BOOTSTRAP_SUCCESS,
            "Employee defaults provisioned.", service.bootstrap());
    }

    private static FormValue firstFile(MultipartFormDataInput input) {
        if (input == null) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_DOCUMENT_STORAGE_FAILED,
                "A multipart file part is required", Map.of("field", "file"));
        }
        return input.getValues().values().stream()
            .flatMap(parts -> parts.stream())
            .filter(part -> part.isFileItem() && part.getFileName() != null
                && !part.getFileName().isBlank())
            .findFirst()
            .orElseThrow(() -> new ApiException(400,
                EmployeeErrorCode.EMPLOYEE_DOCUMENT_STORAGE_FAILED,
                "A multipart file part is required", Map.of("field", "file")));
    }

    private static String formValue(MultipartFormDataInput input, String name) {
        if (input == null) {
            return null;
        }
        return input.getValues().getOrDefault(name, List.of()).stream()
            .filter(part -> !part.isFileItem())
            .map(FormValue::getValue)
            .filter(value -> value != null && !value.isBlank())
            .findFirst()
            .orElse(null);
    }

    private static String contentType(FormValue file) {
        String header = file.getHeaders() == null
            ? null
            : file.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
        return header == null || header.isBlank() ? "application/octet-stream" : header;
    }
}
