package com.vn9melody.openerp.plugins.employee.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.employee.api.EmployeeErrorCode;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ApprovalConfigRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ApprovalConfigResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ApprovalRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.AssignmentRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.AssignmentResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.BootstrapResult;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.CampaignCreateRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.CampaignRecipient;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.CampaignRecipientResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.CampaignResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ChangeRequestCreateRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ChangeRequestResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ChangeRequestStepResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ConsentRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ConsentResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ContractRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ContractResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.DirectoryResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OrgChartNode;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.DocumentRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.DocumentResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.EmployeeRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.EmployeeResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.FieldConfigResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.FieldConfigUpdateRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ImportError;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ImportRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ImportResult;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OffboardRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OnboardingInviteRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OnboardingInviteResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.OnboardingSubmitResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.PrivacyExportResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.PrivacyRequestCreateRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.PrivacyRequestResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.RejectionRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ReportingRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ReportingResponse;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.ScanResultRequest;
import com.vn9melody.openerp.plugins.employee.dto.EmployeeDtos.SignedUrlResponse;
import com.vn9melody.openerp.plugins.employee.model.ChangeRequestStep;
import com.vn9melody.openerp.plugins.employee.model.EmployeeApprovalConfig;
import com.vn9melody.openerp.plugins.employee.model.EmployeeAssignment;
import com.vn9melody.openerp.plugins.employee.model.EmployeeCampaign;
import com.vn9melody.openerp.plugins.employee.model.EmployeeChangeRequest;
import com.vn9melody.openerp.plugins.employee.model.EmployeeConsent;
import com.vn9melody.openerp.plugins.employee.model.EmployeeContract;
import com.vn9melody.openerp.plugins.employee.model.EmployeeDocument;
import com.vn9melody.openerp.plugins.employee.model.EmployeeOnboardingInvite;
import com.vn9melody.openerp.plugins.employee.model.EmployeePrivacyRequest;
import com.vn9melody.openerp.plugins.employee.model.EmployeeProfile;
import com.vn9melody.openerp.plugins.employee.model.FieldConfig;
import com.vn9melody.openerp.plugins.employee.model.ReportingRelationship;
import com.vn9melody.openerp.plugins.employee.model.Rows;
import com.vn9melody.openerp.plugins.employee.model.StoredDocument;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class EmployeeService {

    private static final Logger LOG = Logger.getLogger(EmployeeService.class);
    private static final String SENSITIVE_PERMISSION = "employee:sensitive:read";
    private static final String SELF_READ_PERMISSION = "employee:self:read";
    private static final String SELF_UPDATE_PERMISSION = "employee:self:update";
    private static final String PRIVACY_MANAGE_PERMISSION = "employee:privacy:manage";
    private static final Set<String> CHANGE_STATUSES =
        Set.of("PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN", "CONFLICT", "EXPIRED");
    private static final Set<String> OPEN_CHANGE_STATUSES = Set.of("PENDING", "IN_REVIEW", "CONFLICT");
    private static final Set<String> PRIVACY_OPEN_STATUSES = Set.of("RECEIVED", "IN_PROGRESS");
    private static final Set<String> RECIPIENT_STATUSES = Set.of("PENDING", "COMPLETED", "SKIPPED");
    private static final Set<String> DOCUMENT_MIME_TYPES = Set.of(
        "application/pdf",
        "image/png", "image/jpeg", "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv", "text/plain");
    private static final int MAX_CAMPAIGN_RECIPIENTS = 500;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext context;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    EmployeeGovernanceClient governanceClient;

    @Inject
    OnboardingNotificationClient onboardingNotificationClient;

    @ConfigProperty(name = "employee.onboarding.expiry-hours", defaultValue = "168")
    int onboardingExpiryHours;

    @ConfigProperty(name = "employee.document.storage-dir")
    java.util.Optional<String> documentStorageDir;

    @ConfigProperty(name = "employee.document.max-bytes", defaultValue = "10485760")
    long documentMaxBytes;

    @ConfigProperty(name = "employee.document.clamav.host", defaultValue = "clamav")
    String clamavHost;

    @ConfigProperty(name = "employee.document.clamav.port", defaultValue = "3310")
    int clamavPort;

    @ConfigProperty(name = "employee.document.signed-url.ttl-seconds", defaultValue = "300")
    long signedUrlTtlSeconds;

    @ConfigProperty(name = "employee.document.signed-url.secret", defaultValue = "openerp-employee-signed-url-secret")
    String signedUrlSecret;

    @ConfigProperty(name = "openerp.frontend.url", defaultValue = "https://openerp.9ms.io.vn")
    String frontendUrl;

    // ------------------------------------------------------------------ profiles

    public PagedData<EmployeeResponse> listEmployees(String q, UUID branchId, UUID departmentId,
                                                     String status, String employeeType,
                                                     int page, int size) {
        return listEmployees(q, branchId, departmentId, status, employeeType, page, size, null);
    }

    public PagedData<EmployeeResponse> listEmployees(String q, UUID branchId, UUID departmentId,
                                                     String status, String employeeType,
                                                     int page, int size, Set<UUID> branchScope) {
        int safePage = Math.max(0, page);
        int safeSize = pageSize(size, 100, 20);
        if (branchScope != null && branchScope.isEmpty()) {
            return PagedData.of(List.of(), safePage, safeSize, 0);
        }
        Map<String, Object> params = new HashMap<>();
        putText(params, "q", q);
        putIfPresent(params, "branch_id", branchId);
        putIfPresent(params, "department_id", departmentId);
        putText(params, "status", EmployeeValidation.statusFilter(status));
        putText(params, "employee_type", EmployeeValidation.employeeTypeFilter(employeeType));
        if (branchScope != null) {
            params.put("branch_ids", branchScope);
        }
        params.put("page", safePage);
        params.put("size", safeSize);

        PluginQueryResult result = client.query("employee.list", params);
        List<EmployeeResponse> items = result.rows().stream()
            .map(EmployeeProfile::from)
            .map(profile -> EmployeeResponse.from(profile, false))
            .toList();
        return PagedData.of(items, safePage, safeSize, result.totalRows());
    }

    public EmployeeResponse getEmployee(UUID id) {
        return EmployeeResponse.from(requireEmployee(id), canReadSensitive());
    }

    public EmployeeResponse createEmployee(EmployeeRequest request) {
        requireBody(request);
        String code = EmployeeValidation.employeeCode(request.employeeCode());
        String fullName = EmployeeValidation.fullName(request.fullName());
        ensureCodeAvailable(code);
        if (request.userId() != null) {
            ensureUserAvailable(request.userId(), null);
        }

        Map<String, Object> params = new HashMap<>();
        params.put("employee_code", code);
        params.put("full_name", fullName);
        if (request.status() != null) {
            params.put("status", EmployeeValidation.status(request.status()));
        }
        if (request.employeeType() != null) {
            params.put("employee_type", EmployeeValidation.employeeType(request.employeeType()));
        }
        putIfPresent(params, "user_id", request.userId());
        putText(params, "photo_url", request.photoUrl());
        putIfPresent(params, "date_of_birth", request.dateOfBirth());
        putText(params, "gender", request.gender());
        putText(params, "nationality", request.nationality());
        putText(params, "marital_status", request.maritalStatus());
        putText(params, "national_id", request.nationalId());
        putText(params, "tax_code", request.taxCode());
        putText(params, "social_insurance_no", request.socialInsuranceNo());
        putText(params, "health_insurance_no", request.healthInsuranceNo());
        putText(params, "personal_email", request.personalEmail());
        putText(params, "work_email", request.workEmail());
        putText(params, "phone", request.phone());
        putText(params, "current_address", request.currentAddress());
        putText(params, "permanent_address", request.permanentAddress());
        putText(params, "emergency_contact_name", request.emergencyContactName());
        putText(params, "emergency_contact_relationship", request.emergencyContactRelationship());
        putText(params, "emergency_contact_phone", request.emergencyContactPhone());
        putText(params, "education_level", request.educationLevel());
        putText(params, "school", request.school());
        putText(params, "major", request.major());
        putIfPresent(params, "graduation_year", request.graduationYear());
        putText(params, "notes", request.notes());

        Map<String, Object> row = writeOne("employee.insert", params);
        return EmployeeResponse.from(EmployeeProfile.from(row), canReadSensitive());
    }

    public EmployeeResponse updateEmployee(UUID id, EmployeeRequest request) {
        requireBody(request);
        EmployeeProfile existing = requireEmployee(id);

        String code = request.employeeCode() == null
            ? existing.employeeCode
            : EmployeeValidation.employeeCode(request.employeeCode());
        String fullName = request.fullName() == null
            ? existing.fullName
            : EmployeeValidation.fullName(request.fullName());
        if (!code.equalsIgnoreCase(existing.employeeCode)) {
            ensureCodeAvailable(code);
        }
        if (request.userId() != null && !request.userId().equals(existing.userId)) {
            ensureUserAvailable(request.userId(), id);
        }

        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("employee_code", code);
        params.put("full_name", fullName);
        params.put("updated_at", Instant.now());
        params.put("version", existing.version == null ? 1L : existing.version + 1);
        if (request.status() != null) {
            params.put("status", EmployeeValidation.status(request.status()));
        }
        if (request.employeeType() != null) {
            params.put("employee_type", EmployeeValidation.employeeType(request.employeeType()));
        }
        putIfPresent(params, "user_id", request.userId());
        putText(params, "photo_url", request.photoUrl());
        putIfPresent(params, "date_of_birth", request.dateOfBirth());
        putText(params, "gender", request.gender());
        putText(params, "nationality", request.nationality());
        putText(params, "marital_status", request.maritalStatus());
        putText(params, "national_id", request.nationalId());
        putText(params, "tax_code", request.taxCode());
        putText(params, "social_insurance_no", request.socialInsuranceNo());
        putText(params, "health_insurance_no", request.healthInsuranceNo());
        putText(params, "personal_email", request.personalEmail());
        putText(params, "work_email", request.workEmail());
        putText(params, "phone", request.phone());
        putText(params, "current_address", request.currentAddress());
        putText(params, "permanent_address", request.permanentAddress());
        putText(params, "emergency_contact_name", request.emergencyContactName());
        putText(params, "emergency_contact_relationship", request.emergencyContactRelationship());
        putText(params, "emergency_contact_phone", request.emergencyContactPhone());
        putText(params, "education_level", request.educationLevel());
        putText(params, "school", request.school());
        putText(params, "major", request.major());
        putIfPresent(params, "graduation_year", request.graduationYear());
        putText(params, "notes", request.notes());

        Map<String, Object> row = writeOne("employee.update", params);
        return EmployeeResponse.from(EmployeeProfile.from(row), canReadSensitive());
    }

    /** Export current tenant employees (sensitive fields already masked by the response mapper). */
    public List<EmployeeResponse> exportEmployees() {
        return listEmployees(null, null, null, null, null, 0, 5000).getItems();
    }

    /**
     * Synchronous JSON import with dry-run. Rows are applied one by one; a bad
     * row is reported and does not roll back previously imported rows.
     */
    public ImportResult importEmployees(ImportRequest request) {
        requireBody(request);
        if (request.rows() == null || request.rows().isEmpty()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED,
                "At least one import row is required", Map.of("field", "rows"));
        }
        if (request.rows().size() > 1000) {
            throw new ApiException(400, "VALIDATION_IMPORT_TOO_LARGE",
                "Import is limited to 1000 rows per request", Map.of("limit", 1000));
        }
        List<ImportError> errors = new ArrayList<>();
        int imported = 0;
        for (int index = 0; index < request.rows().size(); index++) {
            EmployeeRequest row = request.rows().get(index);
            try {
                if (row == null) {
                    throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED,
                        "Import row is empty", Map.of("field", "row"));
                }
                if (request.dryRun()) {
                    validateImportRow(row);
                } else {
                    createEmployee(row);
                    imported++;
                }
            } catch (ApiException e) {
                Object field = e.getParams() == null ? null : e.getParams().get("field");
                errors.add(new ImportError(index + 1, e.getCode(),
                    field == null ? null : String.valueOf(field), e.getParams()));
            }
        }
        return new ImportResult(request.dryRun(), imported, errors);
    }

    private void validateImportRow(EmployeeRequest request) {
        String code = EmployeeValidation.employeeCode(request.employeeCode());
        EmployeeValidation.fullName(request.fullName());
        if (request.status() != null) {
            EmployeeValidation.status(request.status());
        }
        if (request.employeeType() != null) {
            EmployeeValidation.employeeType(request.employeeType());
        }
        ensureCodeAvailable(code);
    }

    public EmployeeResponse linkUser(UUID employeeId, UUID userId) {
        EmployeeProfile existing = requireEmployee(employeeId);
        if (userId == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "user_id is required",
                Map.of("field", "user_id"));
        }
        if (existing.userId != null && !existing.userId.equals(userId)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_USER_ALREADY_LINKED,
                "Employee is already linked to another user",
                Map.of("employee_id", employeeId.toString()));
        }
        ensureUserAvailable(userId, employeeId);
        return setUser(employeeId, userId, existing);
    }

    public EmployeeResponse unlinkUser(UUID employeeId) {
        EmployeeProfile existing = requireEmployee(employeeId);
        if (existing.userId == null) {
            return EmployeeResponse.from(existing, canReadSensitive());
        }
        return setUser(employeeId, null, existing);
    }

    public EmployeeResponse offboard(UUID employeeId, OffboardRequest request) {
        requireBody(request);
        EmployeeProfile existing = requireEmployee(employeeId);
        if ("LEFT".equals(existing.status) || "RETIRED".equals(existing.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_ALREADY_LEFT,
                "Employee is already offboarded", Map.of("employee_id", employeeId.toString()));
        }
        LocalDate exitDate = request.exitDate() == null ? LocalDate.now() : request.exitDate();
        if (existing.exitDate != null && exitDate.isBefore(existing.exitDate)) {
            throw new ApiException(400, "VALIDATION_INVALID_DATE_RANGE",
                "exit_date cannot be before the existing exit date",
                Map.of("field", "exit_date"));
        }
        boolean hasSubordinates = client.query("assignment.list_by_manager",
                Map.of("manager_employee_id", employeeId)).rows().stream()
            .map(EmployeeAssignment::from)
            .anyMatch(item -> "ACTIVE".equals(item.status) && !employeeId.equals(item.employeeId));
        if (hasSubordinates) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_OFFBOARD_HAS_SUBORDINATES,
                "Employee still has active subordinates", Map.of("employee_id", employeeId.toString()));
        }
        if (existing.userId != null) {
            EmployeeGovernanceClient.Decision decision = governanceClient.check(existing.userId);
            if (decision.lastOwner()) {
                throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_LAST_OWNER_FORBIDDEN,
                    "Cannot offboard the last tenant owner",
                    Map.of("employee_id", employeeId.toString(), "user_id", existing.userId.toString()));
            }
            if (decision.lastAdmin()) {
                throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_LAST_ADMIN_FORBIDDEN,
                    "Cannot offboard the last tenant admin",
                    Map.of("employee_id", employeeId.toString(), "user_id", existing.userId.toString()));
            }
            if (decision.platformRole()) {
                throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_PLATFORM_ROLE_FORBIDDEN,
                    "Cannot offboard a platform administrator",
                    Map.of("employee_id", employeeId.toString(), "user_id", existing.userId.toString(),
                        "platform_roles", decision.platformRoles()));
            }
        }

        Map<String, Object> params = new HashMap<>();
        params.put("id", employeeId);
        params.put("status", "LEFT");
        params.put("exit_date", exitDate);
        params.put("exit_reason", request.exitReason());
        params.put("archived_at", Instant.now());
        params.put("updated_at", Instant.now());
        params.put("version", existing.version == null ? 1L : existing.version + 1);
        Map<String, Object> row = writeOne("employee.update", params);
        try {
            client.write("employee.mark_scope_sync", Map.of(
                "id", employeeId,
                "scope_sync_status", "NOT_APPLICABLE",
                "updated_at", Instant.now()));
        } catch (RuntimeException e) {
            LOG.warnf("Cannot mark scope sync after offboarding %s: %s", employeeId, e.getMessage());
        }
        emitOutbox("SCOPE_REMOVE", employeeId,
            Map.of("employee_id", employeeId.toString(), "reason", "OFFBOARDED"));
        return EmployeeResponse.from(EmployeeProfile.from(row), canReadSensitive());
    }

    private EmployeeResponse setUser(UUID employeeId, UUID userId, EmployeeProfile existing) {
        Map<String, Object> params = new HashMap<>();
        params.put("id", employeeId);
        params.put("user_id", userId);
        params.put("updated_at", Instant.now());
        params.put("version", existing.version == null ? 1L : existing.version + 1);
        Map<String, Object> row = writeOne("employee.link_user", params);
        try {
            client.write("employee.mark_scope_sync", Map.of(
                "id", employeeId,
                "scope_sync_status", userId == null ? "NOT_APPLICABLE" : "PENDING",
                "updated_at", Instant.now()));
        } catch (RuntimeException e) {
            LOG.warnf("Cannot mark scope sync for employee %s: %s", employeeId, e.getMessage());
        }
        emitOutbox(userId == null ? "SCOPE_REMOVE" : "SCOPE_UPSERT", employeeId,
            Map.of("employee_id", employeeId.toString(),
                "user_id", userId == null ? "" : userId.toString()));
        return EmployeeResponse.from(EmployeeProfile.from(row), canReadSensitive());
    }

    public List<ContractResponse> listContracts(UUID employeeId) {
        requireEmployee(employeeId);
        return client.query("contract.list", Map.of("employee_id", employeeId)).rows().stream()
            .map(EmployeeContract::from).map(ContractResponse::from).toList();
    }

    public ContractResponse createContract(UUID employeeId, ContractRequest request) {
        requireBody(request);
        requireEmployee(employeeId);
        String type = EmployeeValidation.requiredText(request.contractType(), "contract_type", 64);
        String no = EmployeeValidation.requiredText(request.contractNo(), "contract_no", 64);
        LocalDate start = request.startDate() == null ? LocalDate.now() : request.startDate();
        EmployeeValidation.dateRange(start, request.endDate());
        Map<String, Object> params = new HashMap<>();
        params.put("employee_id", employeeId);
        params.put("contract_type", type);
        params.put("contract_no", no);
        params.put("start_date", start);
        params.put("end_date", request.endDate());
        params.put("status", request.status() == null ? "ACTIVE" : request.status());
        params.put("document_id", request.documentId());
        return ContractResponse.from(EmployeeContract.from(writeOne("contract.insert", params)));
    }

    public ContractResponse updateContract(UUID contractId, ContractRequest request) {
        requireBody(request);
        String type = EmployeeValidation.requiredText(request.contractType(), "contract_type", 64);
        String no = EmployeeValidation.requiredText(request.contractNo(), "contract_no", 64);
        LocalDate start = request.startDate() == null ? LocalDate.now() : request.startDate();
        EmployeeValidation.dateRange(start, request.endDate());
        Map<String, Object> params = new HashMap<>();
        params.put("id", contractId);
        params.put("contract_type", type);
        params.put("contract_no", no);
        params.put("start_date", start);
        params.put("end_date", request.endDate());
        params.put("status", request.status() == null ? "ACTIVE" : request.status());
        params.put("document_id", request.documentId());
        return ContractResponse.from(EmployeeContract.from(writeOne("contract.update", params)));
    }

    public List<ReportingResponse> listReporting(UUID employeeId) {
        requireEmployee(employeeId);
        return client.query("reporting.list", Map.of("employee_id", employeeId)).rows().stream()
            .map(ReportingRelationship::from).map(ReportingResponse::from).toList();
    }

    public ReportingResponse createReporting(UUID employeeId, ReportingRequest request) {
        requireBody(request);
        requireEmployee(employeeId);
        UUID managerId = requireId(request.managerEmployeeId(), "manager_employee_id");
        if (managerId.equals(employeeId)) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_SELF_MANAGER,
                "An employee cannot manage themselves", Map.of("employee_id", employeeId.toString()));
        }
        if (firstRow(client.query("employee.get", Map.of("id", managerId))) == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_MANAGER_NOT_FOUND,
                "Manager employee not found", Map.of("manager_employee_id", managerId.toString()));
        }
        String type = request.relationshipType() == null ? "DOTTED" : request.relationshipType().toUpperCase();
        if (!Set.of("PRIMARY", "DOTTED", "MATRIX").contains(type)) {
            throw new ApiException(400, "VALIDATION_INVALID_RELATIONSHIP_TYPE",
                "relationship_type must be PRIMARY, DOTTED or MATRIX");
        }
        LocalDate from = request.validFrom() == null ? LocalDate.now() : request.validFrom();
        EmployeeValidation.dateRange(from, request.validTo());
        Map<String, Object> params = new HashMap<>();
        params.put("employee_id", employeeId);
        params.put("manager_employee_id", managerId);
        params.put("relationship_type", type);
        params.put("valid_from", from);
        params.put("valid_to", request.validTo());
        return ReportingResponse.from(ReportingRelationship.from(writeOne("reporting.insert", params)));
    }

    public void deleteReporting(UUID id) {
        client.write("reporting.delete", Map.of("id", id));
    }

    // --------------------------------------------------------------- assignments

    public List<AssignmentResponse> listAssignments(UUID employeeId) {
        requireEmployee(employeeId);
        return assignmentRows(employeeId).stream()
            .map(EmployeeAssignment::from)
            .map(AssignmentResponse::from)
            .toList();
    }

    public AssignmentResponse createAssignment(UUID employeeId, AssignmentRequest request) {
        requireBody(request);
        EmployeeProfile employee = requireEmployee(employeeId);
        UUID branchId = requireId(request.branchId(), "branch_id");
        UUID departmentId = requireId(request.departmentId(), "department_id");
        String jobTitle = EmployeeValidation.requiredText(request.jobTitle(), "job_title", 255);
        LocalDate validFrom = request.validFrom() == null ? LocalDate.now() : request.validFrom();
        EmployeeValidation.dateRange(validFrom, request.validTo());
        String status = EmployeeValidation.assignmentStatus(request.status());
        boolean primary = Boolean.TRUE.equals(request.isPrimary());

        if (request.managerEmployeeId() != null) {
            if (request.managerEmployeeId().equals(employeeId)) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_SELF_MANAGER,
                    "An employee cannot manage themselves", Map.of("employee_id", employeeId.toString()));
            }
            if (firstRow(client.query("employee.get", Map.of("id", request.managerEmployeeId()))) == null) {
                throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_MANAGER_NOT_FOUND,
                    "Manager employee not found",
                    Map.of("manager_employee_id", request.managerEmployeeId().toString()));
            }
            ensureManagerCycle(employeeId, request.managerEmployeeId());
        }

        List<EmployeeAssignment> existing = assignmentRows(employeeId).stream()
            .map(EmployeeAssignment::from)
            .toList();
        for (EmployeeAssignment item : existing) {
            if (overlaps(validFrom, request.validTo(), item.validFrom, item.validTo)) {
                Map<String, Object> params = new HashMap<>();
                params.put("employee_id", employeeId.toString());
                params.put("valid_from", item.validFrom);
                params.put("valid_to", item.validTo);
                throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_OVERLAP,
                    "Employee assignment period overlaps an existing assignment", params);
            }
        }
        if (primary && existing.stream().anyMatch(item ->
                Boolean.TRUE.equals(item.isPrimary) && "ACTIVE".equals(item.status))) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_PRIMARY_EXISTS,
                "Employee already has a primary assignment", Map.of("employee_id", employeeId.toString()));
        }

        Map<String, Object> params = new HashMap<>();
        params.put("employee_id", employeeId);
        params.put("branch_id", branchId);
        params.put("department_id", departmentId);
        params.put("job_title", jobTitle);
        putIfPresent(params, "job_title_catalog_id", request.jobTitleCatalogId());
        putIfPresent(params, "manager_employee_id", request.managerEmployeeId());
        params.put("is_primary", primary);
        params.put("valid_from", validFrom);
        putIfPresent(params, "valid_to", request.validTo());
        params.put("status", status);

        Map<String, Object> row = writeOne("assignment.insert", params);
        EmployeeAssignment created = EmployeeAssignment.from(row);

        if (employee.userId != null) {
            try {
                client.write("employee.mark_scope_sync", Map.of(
                    "id", employeeId,
                    "scope_sync_status", "PENDING",
                    "updated_at", Instant.now()));
            } catch (RuntimeException e) {
                LOG.warnf("Cannot mark scope sync pending for employee %s: %s", employeeId, e.getMessage());
            }
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("employee_id", employeeId);
            payload.put("user_id", employee.userId);
            payload.put("branch_id", branchId);
            payload.put("department_id", departmentId);
            payload.put("manager_employee_id", request.managerEmployeeId());
            payload.put("valid_from", validFrom);
            payload.put("valid_to", request.validTo());
            emitOutbox("SCOPE_UPSERT", created.id, payload);
        }
        return AssignmentResponse.from(created);
    }

    // -------------------------------------------------------------- self-service

    public EmployeeResponse getSelf() {
        return EmployeeResponse.from(requireSelfProfile(), canReadSensitive());
    }

    public EmployeeResponse updateSelf(Map<String, Object> rawFields) {
        Map<String, Object> fields = EmployeeValidation.selfFields(rawFields);
        EmployeeProfile profile = requireSelfProfile();
        Map<String, FieldConfig> configs = fieldConfigMap();

        Map<String, Object> params = new HashMap<>();
        params.put("id", profile.id);
        params.put("updated_at", Instant.now());
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            FieldConfig config = configs.get(entry.getKey());
            if (config == null || !Boolean.TRUE.equals(config.editableByEmployee)) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_FIELD_NOT_EDITABLE,
                    "Field is not editable by the employee", Map.of("field", entry.getKey()));
            }
            if (Boolean.TRUE.equals(config.requiresApproval)) {
                throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_REQUIRED,
                    "Field requires an approval change request", Map.of("field", entry.getKey()));
            }
            params.put(entry.getKey(), entry.getValue());
        }

        Map<String, Object> updated = writeOne("employee.update", params);
        return EmployeeResponse.from(EmployeeProfile.from(updated), canReadSensitive());
    }

    // ----------------------------------------------------------- change requests

    public PagedData<ChangeRequestResponse> listChangeRequests(String status, UUID employeeId,
                                                               int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = pageSize(size, 100, 20);
        Map<String, Object> params = new HashMap<>();
        putText(params, "status", changeStatusFilter(status));
        putIfPresent(params, "employee_id", employeeId);
        params.put("page", safePage);
        params.put("size", safeSize);

        PluginQueryResult result = client.query("change_request.list", params);
        List<ChangeRequestResponse> items = result.rows().stream()
            .map(EmployeeChangeRequest::from)
            .map(request -> ChangeRequestResponse.from(request, Map.of(), List.of()))
            .toList();
        return PagedData.of(items, safePage, safeSize, result.totalRows());
    }

    public ChangeRequestResponse getChangeRequest(UUID id) {
        EmployeeChangeRequest request = requireChangeRequest(id);
        List<ChangeRequestStepResponse> steps = stepRows(id).stream()
            .map(ChangeRequestStepResponse::from)
            .toList();
        return ChangeRequestResponse.from(request, readJson(request.changesJson), steps);
    }

    public ChangeRequestResponse createChangeRequest(ChangeRequestCreateRequest body) {
        requireBody(body);
        UUID employeeId = requireId(body.employeeId(), "employee_id");
        UUID userId = requireUser();
        requireEmployee(employeeId);
        Map<String, Object> changes = EmployeeValidation.changeFields(body.changes());
        return openChangeRequest(employeeId, userId, changes);
    }

    // ------------------------------------------------------ self change requests

    public PagedData<ChangeRequestResponse> listSelfChangeRequests(String status, int page, int size) {
        EmployeeProfile profile = requireSelfProfile();
        return listChangeRequests(status, profile.id, page, size);
    }

    public ChangeRequestResponse createSelfChangeRequest(Map<String, Object> rawChanges) {
        UUID userId = requireUser();
        EmployeeProfile profile = requireSelfProfile();
        Map<String, Object> changes = EmployeeValidation.changeFields(rawChanges);
        Map<String, FieldConfig> configs = fieldConfigMap();
        for (String field : changes.keySet()) {
            FieldConfig config = configs.get(field);
            if (config == null || !Boolean.TRUE.equals(config.editableByEmployee)) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_FIELD_NOT_EDITABLE,
                    "Field is not editable by the employee", Map.of("field", field));
            }
        }
        return openChangeRequest(profile.id, userId, changes);
    }

    public ChangeRequestResponse withdrawSelfChangeRequest(UUID id) {
        UUID userId = requireUser();
        EmployeeProfile profile = requireSelfProfile();
        EmployeeChangeRequest request = requireChangeRequest(id);
        if (!profile.id.equals(request.employeeId)
                || !userId.equals(request.requestedByUserId)) {
            throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_SELF_FORBIDDEN,
                "Only the requester can withdraw this change request",
                Map.of("change_request_id", id.toString()));
        }
        if (!OPEN_CHANGE_STATUSES.contains(request.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_INVALID_STATE,
                "Change request is not open", Map.of("change_request_id", String.valueOf(id)));
        }
        Instant now = Instant.now();
        for (ChangeRequestStep step : stepRows(id)) {
            if (!"PENDING".equals(step.status)) {
                continue;
            }
            Map<String, Object> stepParams = new HashMap<>();
            stepParams.put("id", step.id);
            stepParams.put("status", "SKIPPED");
            stepParams.put("acted_by", userId);
            stepParams.put("acted_at", now);
            stepParams.put("comment", "WITHDRAWN");
            stepParams.put("updated_at", now);
            writeOne("change_request_step.update", stepParams);
        }

        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("status", "WITHDRAWN");
        params.put("current_step", request.currentStep == null ? 1 : request.currentStep);
        params.put("reviewed_at", now);
        params.put("rejection_reason", null);
        params.put("version", request.version == null ? 1L : request.version + 1);
        params.put("updated_at", now);
        writeOne("change_request.update_status", params);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("change_request_id", id);
        payload.put("employee_id", request.employeeId);
        payload.put("status", "WITHDRAWN");
        emitOutbox("NOTIFICATION", id, payload);
        return getChangeRequest(id);
    }

    private ChangeRequestResponse openChangeRequest(UUID employeeId, UUID userId,
                                                    Map<String, Object> changes) {
        boolean open = changeRequestRows(employeeId).stream()
            .map(EmployeeChangeRequest::from)
            .anyMatch(item -> OPEN_CHANGE_STATUSES.contains(item.status));
        if (open) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_PENDING,
                "An open change request already exists for this employee",
                Map.of("employee_id", employeeId.toString()));
        }
        List<ApprovalChain.Step> chain = resolveApprovalChain(employeeId, changes.keySet());

        Map<String, Object> params = new HashMap<>();
        params.put("employee_id", employeeId);
        params.put("requested_by_user_id", userId);
        params.put("status", "PENDING");
        params.put("current_step", 1);
        params.put("changes", writeJson(changes));
        params.put("submitted_at", Instant.now());
        params.put("version", 0L);
        Map<String, Object> row = writeOne("change_request.insert", params);
        UUID requestId = requireId(EmployeeChangeRequest.from(row).id, "change_request_id");

        for (ApprovalChain.Step step : chain) {
            Map<String, Object> stepParams = new HashMap<>();
            stepParams.put("request_id", requestId);
            stepParams.put("step_no", step.stepNo());
            stepParams.put("approver_type", step.approverType());
            stepParams.put("approver_id", step.approverId());
            stepParams.put("status", "PENDING");
            writeOne("change_request_step.insert", stepParams);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("change_request_id", requestId);
        payload.put("employee_id", employeeId);
        payload.put("status", "PENDING");
        emitOutbox("NOTIFICATION", requestId, payload);
        return getChangeRequest(requestId);
    }

    private List<ApprovalChain.Step> resolveApprovalChain(UUID employeeId, Set<String> changedFields) {
        List<EmployeeApprovalConfig> configs = approvalConfigRows();
        if (configs.isEmpty()) {
            return ApprovalChain.defaultChain();
        }
        EmployeeAssignment primary = assignmentRows(employeeId).stream()
            .map(EmployeeAssignment::from)
            .filter(item -> "ACTIVE".equals(item.status))
            .sorted(Comparator.comparing((EmployeeAssignment item) ->
                    Boolean.TRUE.equals(item.isPrimary)).reversed()
                .thenComparing(item -> item.validFrom == null ? LocalDate.MIN : item.validFrom,
                    Comparator.reverseOrder()))
            .findFirst()
            .orElse(null);
        List<ApprovalChain.ConfigRow> rows = configs.stream()
            .map(item -> new ApprovalChain.ConfigRow(item.scopeType, item.scopeId,
                item.fieldGroup, item.stepNo, item.approverType, item.approverId))
            .toList();
        return ApprovalChain.resolve(rows, EmployeeValidation.fieldGroups(changedFields),
            primary == null ? null : primary.branchId,
            primary == null ? null : primary.departmentId);
    }

    public ChangeRequestResponse approveChangeRequest(UUID id, ApprovalRequest body) {
        UUID userId = requireUser();
        EmployeeChangeRequest request = requireChangeRequest(id);
        assertOpen(request);
        if (userId.equals(request.requestedByUserId)) {
            throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_SELF_APPROVAL_FORBIDDEN,
                "A requester cannot approve their own change request",
                Map.of("change_request_id", id.toString()));
        }
        List<ChangeRequestStep> steps = stepRows(id);
        ChangeRequestStep current = currentStep(request, steps);
        Instant now = Instant.now();
        String comment = body == null ? null : body.comment();
        ChangeRequestStep next = steps.stream()
            .filter(item -> "PENDING".equals(item.status))
            .filter(item -> item.stepNo != null && current.stepNo != null && item.stepNo > current.stepNo)
            .min((left, right) -> Integer.compare(left.stepNo, right.stepNo))
            .orElse(null);

        if (next == null) {
            applyChangeRequest(request);
        }

        Map<String, Object> stepParams = new HashMap<>();
        stepParams.put("id", current.id);
        stepParams.put("status", "APPROVED");
        stepParams.put("acted_by", userId);
        stepParams.put("acted_at", now);
        stepParams.put("comment", comment);
        stepParams.put("updated_at", now);
        writeOne("change_request_step.update", stepParams);

        long version = request.version == null ? 1L : request.version + 1;
        Map<String, Object> requestParams = new HashMap<>();
        requestParams.put("id", id);
        requestParams.put("status", next == null ? "APPROVED" : "IN_REVIEW");
        requestParams.put("current_step", next == null ? current.stepNo : next.stepNo);
        requestParams.put("reviewed_at", next == null ? now : null);
        requestParams.put("rejection_reason", null);
        requestParams.put("version", version);
        requestParams.put("updated_at", now);
        writeOne("change_request.update_status", requestParams);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("change_request_id", id);
        payload.put("employee_id", request.employeeId);
        payload.put("status", next == null ? "APPROVED" : "IN_REVIEW");
        emitOutbox("NOTIFICATION", id, payload);
        return getChangeRequest(id);
    }

    public ChangeRequestResponse rejectChangeRequest(UUID id, RejectionRequest body) {
        UUID userId = requireUser();
        String reason = body == null ? null : body.reason();
        if (reason == null || reason.isBlank()) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_REJECTION_REASON_REQUIRED,
                "Rejection reason is required", Map.of("field", "reason"));
        }
        String normalizedReason = reason.trim();
        EmployeeChangeRequest request = requireChangeRequest(id);
        assertOpen(request);
        if (userId.equals(request.requestedByUserId)) {
            throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_SELF_APPROVAL_FORBIDDEN,
                "A requester cannot reject their own change request",
                Map.of("change_request_id", id.toString()));
        }
        ChangeRequestStep current = currentStep(request, stepRows(id));
        Instant now = Instant.now();

        Map<String, Object> stepParams = new HashMap<>();
        stepParams.put("id", current.id);
        stepParams.put("status", "REJECTED");
        stepParams.put("acted_by", userId);
        stepParams.put("acted_at", now);
        stepParams.put("comment", normalizedReason);
        stepParams.put("updated_at", now);
        writeOne("change_request_step.update", stepParams);

        Map<String, Object> requestParams = new HashMap<>();
        requestParams.put("id", id);
        requestParams.put("status", "REJECTED");
        requestParams.put("current_step", current.stepNo);
        requestParams.put("reviewed_at", now);
        requestParams.put("rejection_reason", normalizedReason);
        requestParams.put("version", request.version == null ? 1L : request.version + 1);
        requestParams.put("updated_at", now);
        writeOne("change_request.update_status", requestParams);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("change_request_id", id);
        payload.put("employee_id", request.employeeId);
        payload.put("status", "REJECTED");
        emitOutbox("NOTIFICATION", id, payload);
        return getChangeRequest(id);
    }

    // -------------------------------------------------------------------- config

    public List<FieldConfigResponse> listFieldConfigs() {
        return fieldConfigRows().stream().map(FieldConfigResponse::from).toList();
    }

    public List<FieldConfigResponse> updateFieldConfigs(List<FieldConfigUpdateRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED,
                "At least one field config is required", Map.of("field", "items"));
        }
        Map<String, FieldConfig> existing = new HashMap<>();
        for (FieldConfig config : fieldConfigRows()) {
            existing.put(config.fieldKey, config);
        }
        UUID userId = context.userId();

        for (FieldConfigUpdateRequest request : requests) {
            requireBody(request);
            String key = EmployeeValidation.fieldKey(request.fieldKey());
            EmployeeFields seed = EmployeeFields.fromKey(key);
            if (seed == null) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_FIELD_CONFIG_UNKNOWN,
                    "field_key is not a known employee field", Map.of("field", "field_key"));
            }
            FieldConfig current = existing.get(key);
            boolean editable = request.editableByEmployee() == null
                ? current == null ? seed.editableByDefault() : Boolean.TRUE.equals(current.editableByEmployee)
                : request.editableByEmployee();
            boolean approval = request.requiresApproval() == null
                ? current == null ? seed.requiresApprovalByDefault() : Boolean.TRUE.equals(current.requiresApproval)
                : request.requiresApproval();
            int sortOrder = request.sortOrder() == null
                ? current == null || current.sortOrder == null ? seed.sortOrder() : current.sortOrder
                : request.sortOrder();

            if (current == null) {
                Map<String, Object> insert = new HashMap<>();
                insert.put("field_key", key);
                insert.put("editable_by_employee", editable);
                insert.put("requires_approval", approval);
                insert.put("sort_order", sortOrder);
                insert.put("updated_by", userId);
                insert.put("updated_at", Instant.now());
                writeOne("field_config.insert", insert);
            } else {
                Map<String, Object> update = new HashMap<>();
                update.put("field_key", key);
                update.put("editable_by_employee", editable);
                update.put("requires_approval", approval);
                update.put("sort_order", sortOrder);
                update.put("updated_by", userId);
                update.put("updated_at", Instant.now());
                writeOne("field_config.update", update);
            }
            FieldConfig effective = new FieldConfig();
            effective.fieldKey = key;
            effective.editableByEmployee = editable;
            effective.requiresApproval = approval;
            effective.sortOrder = sortOrder;
            effective.updatedBy = userId;
            effective.updatedAt = Instant.now();
            existing.put(key, effective);
        }
        return listFieldConfigs();
    }

    // -------------------------------------------------------- approval config

    public List<ApprovalConfigResponse> listApprovalConfigs() {
        return approvalConfigRows().stream().map(ApprovalConfigResponse::from).toList();
    }

    private record ApprovalRow(ApprovalConfigRequest request, String scopeType, UUID scopeId,
                               String group, int stepNo, String approverType, UUID approverId) {
        private String key() {
            return approvalConfigKey(scopeType, scopeId, group, stepNo);
        }
    }

    public List<ApprovalConfigResponse> upsertApprovalConfigs(List<ApprovalConfigRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED,
                "At least one approval config row is required", Map.of("field", "items"));
        }
        Map<UUID, EmployeeApprovalConfig> byId = new HashMap<>();
        for (EmployeeApprovalConfig item : approvalConfigRows()) {
            byId.put(item.id, item);
        }
        List<ApprovalRow> rows = new ArrayList<>();
        Set<String> requestedKeys = new HashSet<>();
        Set<UUID> requestIds = new HashSet<>();

        for (ApprovalConfigRequest request : requests) {
            requireBody(request);
            String scopeType = EmployeeValidation.approvalScopeType(request.scopeType());
            UUID scopeId = request.scopeId();
            if ("TENANT".equals(scopeType)) {
                scopeId = null;
            } else if (scopeId == null) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_APPROVAL_CHAIN_INVALID,
                    "scope_id is required for BRANCH or DEPARTMENT scope",
                    Map.of("field", "scope_id"));
            }
            String group = EmployeeValidation.fieldGroup(request.fieldGroup());
            int stepNo = EmployeeValidation.approvalStep(request.stepNo());
            String approverType = EmployeeValidation.approverType(request.approverType());
            UUID approverId = request.approverId();
            if ("USER".equals(approverType) && approverId == null) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_APPROVAL_CHAIN_INVALID,
                    "approver_id is required for USER approvers", Map.of("field", "approver_id"));
            }
            ApprovalRow row = new ApprovalRow(request, scopeType, scopeId, group, stepNo, approverType, approverId);
            if (!requestedKeys.add(row.key())) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_APPROVAL_CHAIN_INVALID,
                    "Duplicate approval step in request", Map.of("step_no", stepNo, "field_group", group));
            }
            if (request.id() != null) {
                if (!byId.containsKey(request.id())) {
                    throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_APPROVAL_CONFIG_NOT_FOUND,
                        "Approval config row not found", Map.of("approval_config_id", request.id().toString()));
                }
                if (!requestIds.add(request.id())) {
                    throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_APPROVAL_CHAIN_INVALID,
                        "Approval config row repeated in request", Map.of("approval_config_id", request.id().toString()));
                }
            }
            rows.add(row);
        }

        // A final key may be owned by another row in this same request (step swap/reorder), but never by an
        // unchanged row outside it — that would create a duplicate step.
        for (ApprovalRow row : rows) {
            EmployeeApprovalConfig owner = approvalByKey(byId.values(), row.key());
            if (row.request().id() != null && owner != null && !requestIds.contains(owner.id)) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_APPROVAL_CHAIN_INVALID,
                    "Approval step already exists for this scope", Map.of("step_no", row.stepNo()));
            }
        }

        List<UUID> targetIds = new ArrayList<>(rows.size());
        for (ApprovalRow row : rows) {
            EmployeeApprovalConfig target = row.request().id() == null
                ? approvalByKey(byId.values(), row.key())
                : byId.get(row.request().id());
            targetIds.add(target == null ? null : target.id);
        }

        // Two-phase write: park every existing target on a temporary high step first, otherwise a
        // step swap/reorder collides with uq_employee_approval_scope. A failure mid-flight can leave
        // temporary steps; saving again from the UI repairs them.
        Set<UUID> parked = new HashSet<>();
        int tempStep = 1;
        for (EmployeeApprovalConfig item : byId.values()) {
            tempStep = Math.max(tempStep, item.stepNo == null ? 0 : item.stepNo);
        }
        for (ApprovalRow row : rows) {
            tempStep = Math.max(tempStep, row.stepNo());
        }
        tempStep += 1000;
        for (UUID targetId : targetIds) {
            if (targetId == null || !parked.add(targetId)) {
                continue;
            }
            EmployeeApprovalConfig current = byId.get(targetId);
            Map<String, Object> park = new HashMap<>();
            park.put("id", current.id);
            park.put("scope_type", current.scopeType);
            park.put("scope_id", current.scopeId);
            park.put("field_group", current.fieldGroup);
            park.put("step_no", tempStep++);
            park.put("approver_type", current.approverType);
            park.put("approver_id", current.approverId);
            byId.put(current.id, EmployeeApprovalConfig.from(writeOne("approval_config.update", park)));
        }

        for (int i = 0; i < rows.size(); i++) {
            ApprovalRow row = rows.get(i);
            UUID targetId = targetIds.get(i);
            Map<String, Object> params = new HashMap<>();
            params.put("scope_type", row.scopeType());
            params.put("scope_id", row.scopeId());
            params.put("field_group", row.group());
            params.put("step_no", row.stepNo());
            params.put("approver_type", row.approverType());
            params.put("approver_id", row.approverId());
            if (targetId == null) {
                EmployeeApprovalConfig created = EmployeeApprovalConfig.from(
                    writeOne("approval_config.insert", params));
                byId.put(created.id, created);
            } else {
                params.put("id", targetId);
                EmployeeApprovalConfig updated = EmployeeApprovalConfig.from(
                    writeOne("approval_config.update", params));
                byId.put(updated.id, updated);
            }
        }
        return listApprovalConfigs();
    }

    private static EmployeeApprovalConfig approvalByKey(Iterable<EmployeeApprovalConfig> rows, String key) {
        for (EmployeeApprovalConfig row : rows) {
            if (approvalConfigKey(row).equals(key)) {
                return row;
            }
        }
        return null;
    }

    public void deleteApprovalConfig(UUID id) {
        UUID required = requireId(id, "approval_config_id");
        PluginQueryResult result = client.write("approval_config.delete", Map.of("id", required));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_APPROVAL_CONFIG_NOT_FOUND,
                "Approval config row not found", Map.of("approval_config_id", required.toString()));
        }
    }

    public BootstrapResult bootstrap() {        if (context.tenantId() == null) {
            throw new ApiException(401, EmployeeErrorCode.EMPLOYEE_BOOTSTRAP_TENANT_REQUIRED,
                "Tenant context is required", Map.of());
        }
        List<FieldConfig> existing = fieldConfigRows();
        Set<String> keys = new HashSet<>();
        for (FieldConfig config : existing) {
            keys.add(config.fieldKey);
        }
        int seeded = 0;
        UUID userId = context.userId();
        for (EmployeeFields field : EmployeeFields.values()) {
            if (keys.contains(field.key())) {
                continue;
            }
            Map<String, Object> params = new HashMap<>();
            params.put("field_key", field.key());
            params.put("editable_by_employee", field.editableByDefault());
            params.put("requires_approval", field.requiresApprovalByDefault());
            params.put("sort_order", field.sortOrder());
            params.put("updated_by", userId);
            params.put("updated_at", Instant.now());
            writeOne("field_config.insert", params);
            seeded++;
        }
        seedApprovalDefaults();
        return new BootstrapResult(seeded, existing.size() + seeded);
    }

    /** Basic tenant-wide chain: direct manager, then HR/admin role. */
    private void seedApprovalDefaults() {
        if (!approvalConfigRows().isEmpty()) {
            return;
        }
        writeOne("approval_config.insert", Map.of(
            "scope_type", "TENANT",
            "field_group", "PROFILE",
            "step_no", 1,
            "approver_type", "MANAGER"
        ));
        writeOne("approval_config.insert", Map.of(
            "scope_type", "TENANT",
            "field_group", "PROFILE",
            "step_no", 2,
            "approver_type", "ROLE"
        ));
    }

    // ------------------------------------------------------------- onboarding

    public OnboardingInviteResponse createOnboardingInvite(OnboardingInviteRequest request) {
        requireBody(request);
        String email = EmployeeValidation.onboardingEmail(request.email());
        if (request.employeeId() != null) {
            requireEmployee(request.employeeId());
        }
        int hours = EmployeeValidation.onboardingExpiryHours(request.expiresInHours(),
            onboardingExpiryHours);
        String token = newOnboardingToken();
        Instant expiresAt = Instant.now().plus(hours, ChronoUnit.HOURS);

        Map<String, Object> params = new HashMap<>();
        putIfPresent(params, "employee_id", request.employeeId());
        params.put("email", email);
        params.put("token_hash", sha256Hex(token));
        params.put("expires_at", expiresAt);
        params.put("status", "PENDING");
        putIfPresent(params, "created_by", context.userId());
        EmployeeOnboardingInvite invite = EmployeeOnboardingInvite.from(
            writeOne("onboarding.insert", params));
        String link = onboardingLink(token);
        OnboardingNotificationClient.Result notification =
            onboardingNotificationClient.notify(email, link, invite.expiresAt);
        return OnboardingInviteResponse.from(invite, token, link,
            notification.notified(), notification.reason());
    }

    public PagedData<OnboardingInviteResponse> listOnboardingInvites(String status, String email,
                                                                     int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = pageSize(size, 100, 20);
        Map<String, Object> params = new HashMap<>();
        putText(params, "status", EmployeeValidation.onboardingStatusFilter(status));
        if (email != null && !email.isBlank()) {
            params.put("email", email.trim().toLowerCase());
        }
        params.put("page", safePage);
        params.put("size", safeSize);

        PluginQueryResult result = client.query("onboarding.list", params);
        List<OnboardingInviteResponse> items = result.rows().stream()
            .map(EmployeeOnboardingInvite::from)
            .map(item -> OnboardingInviteResponse.from(item, null, null))
            .toList();
        return PagedData.of(items, safePage, safeSize, result.totalRows());
    }

    public OnboardingInviteResponse revokeOnboardingInvite(UUID id) {
        EmployeeOnboardingInvite invite = requireOnboardingInvite(id);
        if (!"PENDING".equals(invite.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_ONBOARDING_INVITE_INVALID_STATE,
                "Only a pending onboarding invite can be revoked",
                Map.of("onboarding_invite_id", id.toString()));
        }
        PluginQueryResult result = client.write("onboarding.update_status", Map.of(
            "id", id,
            "status", "REVOKED",
            "expected_status", "PENDING"));
        if (result.rows().isEmpty()) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_ONBOARDING_INVITE_INVALID_STATE,
                "Onboarding invite is no longer pending",
                Map.of("onboarding_invite_id", id.toString()));
        }
        return OnboardingInviteResponse.from(EmployeeOnboardingInvite.from(result.rows().get(0)),
            null, null);
    }

    /** Public one-time submit. The caller is anonymous; the gateway supplies the tenant. */
    public OnboardingSubmitResponse submitOnboarding(String token, Map<String, Object> body) {
        String rawToken = EmployeeValidation.onboardingToken(token);
        if (context.tenantId() == null) {
            throw new ApiException(401, EmployeeErrorCode.EMPLOYEE_ONBOARDING_TENANT_REQUIRED,
                "Tenant context is required for onboarding submission", Map.of());
        }
        Map<String, Object> row = firstRow(client.query("onboarding.get_by_token",
            Map.of("token_hash", sha256Hex(rawToken))));
        if (row == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_ONBOARDING_TOKEN_INVALID,
                "Onboarding token is invalid", Map.of());
        }
        EmployeeOnboardingInvite invite = EmployeeOnboardingInvite.from(row);
        Instant now = Instant.now();
        if (invite.expiresAt != null && !now.isBefore(invite.expiresAt)) {
            client.write("onboarding.update_status", Map.of(
                "id", invite.id,
                "status", "EXPIRED",
                "expected_status", "PENDING"));
            throw new ApiException(410, EmployeeErrorCode.EMPLOYEE_ONBOARDING_TOKEN_EXPIRED,
                "Onboarding token has expired", Map.of());
        }
        if (!"PENDING".equals(invite.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_ONBOARDING_TOKEN_USED,
                "Onboarding token has already been used",
                Map.of("onboarding_invite_id", invite.id.toString()));
        }
        Map<String, Object> fields = EmployeeValidation.onboardingFields(body);

        Map<String, Object> params = new HashMap<>();
        params.put("id", invite.id);
        params.put("status", "SUBMITTED");
        params.put("submitted_at", now);
        params.put("payload", writeJson(fields));
        params.put("expected_status", "PENDING");
        PluginQueryResult result = client.write("onboarding.update_status", params);
        if (result.rows().isEmpty()) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_ONBOARDING_TOKEN_USED,
                "Onboarding token has already been used",
                Map.of("onboarding_invite_id", invite.id.toString()));
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("onboarding_invite_id", invite.id);
        payload.put("email", invite.email);
        payload.put("status", "SUBMITTED");
        payload.put("field_count", fields.size());
        emitOutbox("NOTIFICATION", invite.id, payload);
        return new OnboardingSubmitResponse(invite.id.toString(), "SUBMITTED", now);
    }

    // --------------------------------------------------------------- campaigns

    public CampaignResponse createCampaign(CampaignCreateRequest request) {
        requireBody(request);
        String name = EmployeeValidation.requiredText(request.name(), "name", 255);
        String status = request.status() == null
            ? "ACTIVE"
            : EmployeeValidation.campaignStatus(request.status());
        if ("CLOSED".equals(status)) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_CAMPAIGN_INVALID_STATE,
                "A campaign cannot be created as CLOSED", Map.of("field", "status"));
        }
        Map<String, Object> rawFilter = request.filter() == null
            ? Map.of()
            : request.filter();
        for (String key : rawFilter.keySet()) {
            if (!Set.of("status", "employee_ids").contains(key)) {
                throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                    "Unsupported campaign filter key", Map.of("field", "filter." + key));
            }
        }
        String filterStatus = rawFilter.get("status") == null
            ? "ALL"
            : EmployeeValidation.campaignFilterStatus(String.valueOf(rawFilter.get("status")));
        List<UUID> explicitIds = request.employeeIds() == null
            ? filterEmployeeIds(rawFilter.get("employee_ids"))
            : request.employeeIds();
        List<UUID> recipients = resolveCampaignRecipients(explicitIds, filterStatus);

        Map<String, Object> storedFilter = new LinkedHashMap<>();
        storedFilter.put("status", filterStatus);
        if (explicitIds != null) {
            storedFilter.put("employee_ids", explicitIds.stream().map(UUID::toString).toList());
        }

        Map<String, Object> params = new HashMap<>();
        params.put("name", name);
        params.put("filter", writeJson(storedFilter));
        putIfPresent(params, "deadline", request.deadline());
        params.put("status", status);
        putIfPresent(params, "created_by", context.userId());
        EmployeeCampaign campaign = EmployeeCampaign.from(writeOne("campaign.insert", params));

        for (UUID employeeId : recipients) {
            Map<String, Object> recipient = new HashMap<>();
            recipient.put("campaign_id", campaign.id);
            recipient.put("employee_id", employeeId);
            recipient.put("status", "PENDING");
            writeOne("campaign_recipient.insert", recipient);
        }

        if ("ACTIVE".equals(status)) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("campaign_id", campaign.id);
            payload.put("recipient_count", recipients.size());
            payload.put("status", status);
            emitOutbox("NOTIFICATION", campaign.id, payload);
        }
        return CampaignResponse.from(campaign, readJson(campaign.filterJson));
    }

    public PagedData<CampaignResponse> listCampaigns(String status, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = pageSize(size, 100, 20);
        Map<String, Object> params = new HashMap<>();
        putText(params, "status", EmployeeValidation.campaignStatusFilter(status));
        params.put("page", safePage);
        params.put("size", safeSize);
        PluginQueryResult result = client.query("campaign.list", params);
        List<CampaignResponse> items = result.rows().stream()
            .map(EmployeeCampaign::from)
            .map(item -> CampaignResponse.from(item, readJson(item.filterJson)))
            .toList();
        return PagedData.of(items, safePage, safeSize, result.totalRows());
    }

    public PagedData<CampaignRecipientResponse> listCampaignRecipients(UUID campaignId,
                                                                       String status,
                                                                       int page, int size) {
        requireCampaign(campaignId);
        int safePage = Math.max(0, page);
        int safeSize = pageSize(size, 100, 20);
        Map<String, Object> params = new HashMap<>();
        params.put("campaign_id", campaignId);
        if (status != null && !status.isBlank()) {
            String normalized = status.trim().toUpperCase();
            if (!RECIPIENT_STATUSES.contains(normalized)) {
                throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                    "status must be PENDING, COMPLETED or SKIPPED", Map.of("field", "status"));
            }
            params.put("status", normalized);
        }
        params.put("page", safePage);
        params.put("size", safeSize);
        PluginQueryResult result = client.query("campaign_recipient.list", params);
        List<CampaignRecipientResponse> items = result.rows().stream()
            .map(CampaignRecipient::from)
            .map(CampaignRecipientResponse::from)
            .toList();
        return PagedData.of(items, safePage, safeSize, result.totalRows());
    }

    public CampaignResponse closeCampaign(UUID campaignId) {
        EmployeeCampaign campaign = requireCampaign(campaignId);
        if ("CLOSED".equals(campaign.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_CAMPAIGN_INVALID_STATE,
                "Campaign is already closed", Map.of("campaign_id", campaignId.toString()));
        }
        Map<String, Object> params = new HashMap<>();
        params.put("id", campaignId);
        params.put("status", "CLOSED");
        params.put("expected_status", campaign.status);
        PluginQueryResult closedResult = client.write("campaign.update_status", params);
        if (closedResult.rows().isEmpty()) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_CAMPAIGN_INVALID_STATE,
                "Campaign state changed; close aborted",
                Map.of("campaign_id", campaignId.toString()));
        }

        client.write("campaign_recipient.skip_pending", Map.of(
            "campaign_id", campaignId,
            "from_status", "PENDING",
            "status", "SKIPPED"));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("campaign_id", campaignId);
        payload.put("status", "CLOSED");
        emitOutbox("NOTIFICATION", campaignId, payload);
        EmployeeCampaign closed = EmployeeCampaign.from(closedResult.rows().get(0));
        return CampaignResponse.from(closed, readJson(closed.filterJson));
    }

    // ----------------------------------------------------------------- privacy

    public PrivacyRequestResponse createPrivacyRequest(PrivacyRequestCreateRequest request) {
        requireBody(request);
        UUID actorUserId = requireUser();
        boolean manager = canManagePrivacy();
        EmployeeProfile employee;
        UUID employeeId = request.employeeId();
        if (employeeId == null) {
            if (!manager && !hasPermission(SELF_UPDATE_PERMISSION)) {
                throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_PRIVACY_FORBIDDEN,
                    "Self-service permission is required", Map.of());
            }
            employee = requireSelfProfile();
            employeeId = employee.id;
        } else {
            if (!manager) {
                throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_PRIVACY_FORBIDDEN,
                    "Privacy management permission is required", Map.of());
            }
            employee = requireEmployee(employeeId);
        }
        UUID subjectUserId = request.employeeId() == null
            ? actorUserId
            : employee.userId != null ? employee.userId
            : request.subjectUserId() != null ? request.subjectUserId() : actorUserId;
        String requestType = EmployeeValidation.privacyRequestType(request.requestType());
        Map<String, Object> payload = request.payload() == null ? Map.of() : request.payload();

        Map<String, Object> params = new HashMap<>();
        params.put("subject_user_id", subjectUserId);
        params.put("employee_id", employeeId);
        params.put("request_type", requestType);
        params.put("status", "RECEIVED");
        params.put("payload", writeJson(payload));
        putIfPresent(params, "due_at", request.dueAt());
        EmployeePrivacyRequest created = EmployeePrivacyRequest.from(
            writeOne("privacy.insert", params));
        return PrivacyRequestResponse.from(created, readJson(created.payloadJson));
    }

    public PagedData<PrivacyRequestResponse> listPrivacyRequests(String status, UUID employeeId,
                                                                  int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = pageSize(size, 100, 20);
        Map<String, Object> params = new HashMap<>();
        putText(params, "status", EmployeeValidation.privacyStatusFilter(status));
        putIfPresent(params, "employee_id", employeeId);
        params.put("page", safePage);
        params.put("size", safeSize);
        PluginQueryResult result = client.query("privacy.list", params);
        List<PrivacyRequestResponse> items = result.rows().stream()
            .map(EmployeePrivacyRequest::from)
            .map(item -> PrivacyRequestResponse.from(item, readJson(item.payloadJson)))
            .toList();
        return PagedData.of(items, safePage, safeSize, result.totalRows());
    }

    public PrivacyRequestResponse completePrivacyRequest(UUID id) {
        EmployeePrivacyRequest request = requirePrivacyRequest(id);
        if (!PRIVACY_OPEN_STATUSES.contains(request.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_INVALID_STATE,
                "Privacy request is already closed", Map.of("privacy_request_id", id.toString()));
        }
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("status", "COMPLETED");
        params.put("completed_at", Instant.now());
        EmployeePrivacyRequest completed = EmployeePrivacyRequest.from(
            writeOne("privacy.update_status", params));
        return PrivacyRequestResponse.from(completed, readJson(completed.payloadJson));
    }

    public PrivacyExportResponse exportPrivacyRequest(UUID id) {
        EmployeePrivacyRequest request = requirePrivacyRequest(id);
        if (!"EXPORT".equals(request.requestType)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_INVALID_STATE,
                "Only EXPORT requests can be exported", Map.of("privacy_request_id", id.toString()));
        }
        EmployeeProfile employee = requireEmployee(request.employeeId);
        return new PrivacyExportResponse(
            PrivacyRequestResponse.from(request, readJson(request.payloadJson)),
            EmployeeResponse.from(employee, true),
            listAssignments(employee.id),
            listContracts(employee.id),
            listDocuments(employee.id),
            listConsents(employee.id, null),
            Instant.now());
    }

    public PrivacyRequestResponse erasePrivacyRequest(UUID id) {
        EmployeePrivacyRequest request = requirePrivacyRequest(id);
        if (!"DELETE".equals(request.requestType)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_INVALID_STATE,
                "Only DELETE requests can be erased", Map.of("privacy_request_id", id.toString()));
        }
        if (!PRIVACY_OPEN_STATUSES.contains(request.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_INVALID_STATE,
                "Privacy request is already closed", Map.of("privacy_request_id", id.toString()));
        }
        EmployeeProfile employee = requireEmployee(request.employeeId);
        Instant now = Instant.now();
        Map<String, Object> anonymize = new HashMap<>();
        anonymize.put("id", employee.id);
        anonymize.put("full_name", "ANONYMIZED-" + employee.employeeCode);
        anonymize.put("photo_url", null);
        anonymize.put("user_id", null);
        anonymize.put("status", "LEFT");
        anonymize.put("date_of_birth", null);
        anonymize.put("gender", null);
        anonymize.put("nationality", null);
        anonymize.put("marital_status", null);
        anonymize.put("national_id", null);
        anonymize.put("tax_code", null);
        anonymize.put("social_insurance_no", null);
        anonymize.put("health_insurance_no", null);
        anonymize.put("personal_email", null);
        anonymize.put("work_email", null);
        anonymize.put("phone", null);
        anonymize.put("current_address", null);
        anonymize.put("permanent_address", null);
        anonymize.put("emergency_contact_name", null);
        anonymize.put("emergency_contact_relationship", null);
        anonymize.put("emergency_contact_phone", null);
        anonymize.put("education_level", null);
        anonymize.put("school", null);
        anonymize.put("major", null);
        anonymize.put("graduation_year", null);
        anonymize.put("notes", null);
        anonymize.put("scope_sync_status", "NOT_APPLICABLE");
        anonymize.put("updated_at", now);
        writeOne("employee.anonymize", anonymize);

        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("status", "COMPLETED");
        params.put("completed_at", now);
        EmployeePrivacyRequest completed = EmployeePrivacyRequest.from(
            writeOne("privacy.update_status", params));
        return PrivacyRequestResponse.from(completed, readJson(completed.payloadJson));
    }

    public List<ConsentResponse> listConsents(UUID employeeId, String purpose) {
        UUID target = resolveConsentEmployee(employeeId, false);
        Map<String, Object> params = new HashMap<>();
        params.put("employee_id", target);
        if (purpose != null && !purpose.isBlank()) {
            params.put("purpose", EmployeeValidation.consentPurpose(purpose));
        }
        params.put("page", 0);
        params.put("size", 200);
        return client.query("consent.list", params).rows().stream()
            .map(EmployeeConsent::from)
            .map(ConsentResponse::from)
            .toList();
    }

    public ConsentResponse upsertConsent(ConsentRequest request) {
        requireBody(request);
        UUID target = resolveConsentEmployee(request.employeeId(), true);
        String purpose = EmployeeValidation.consentPurpose(request.purpose());
        String status = EmployeeValidation.consentStatus(request.status());
        Instant now = Instant.now();

        Map<String, Object> existingRow = firstRow(client.query("consent.get_by_key",
            Map.of("employee_id", target, "purpose", purpose)));
        String source = request.employeeId() == null ? "SELF" : "HR";
        Instant grantedAt = "GRANTED".equals(status) ? now : null;
        Instant revokedAt = "REVOKED".equals(status) ? now : null;
        if (existingRow != null && "GRANTED".equals(status)) {
            grantedAt = Rows.instant(existingRow.get("granted_at"));
            if (grantedAt == null) {
                grantedAt = now;
            }
        }
        Map<String, Object> params = new HashMap<>();
        params.put("employee_id", target);
        params.put("purpose", purpose);
        params.put("status", status);
        params.put("granted_at", grantedAt);
        params.put("revoked_at", revokedAt);
        params.put("source", source);
        EmployeeConsent consent;
        if (existingRow == null) {
            consent = EmployeeConsent.from(writeOne("consent.insert", params));
        } else {
            params.put("id", Rows.uuid(existingRow.get("id")));
            consent = EmployeeConsent.from(writeOne("consent.update", params));
        }
        return ConsentResponse.from(consent);
    }

    // ----------------------------------------------------------------- directory

    public PagedData<DirectoryResponse> directory(String q, String status, String employeeType,
                                                  int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = pageSize(size, 100, 20);
        Map<String, Object> params = new HashMap<>();
        putText(params, "q", q);
        String filter = EmployeeValidation.statusFilter(status);
        params.put("status", filter == null ? "ACTIVE" : filter);
        putText(params, "employee_type", EmployeeValidation.employeeTypeFilter(employeeType));
        params.put("page", safePage);
        params.put("size", safeSize);

        PluginQueryResult result = client.query("directory.list", params);
        List<DirectoryResponse> items = result.rows().stream()
            .map(EmployeeProfile::from)
            .map(DirectoryResponse::from)
            .toList();
        return PagedData.of(items, safePage, safeSize, result.totalRows());
    }

    /** Read-only org chart from active employees + reporting relationships (no sensitive fields). */
    public List<OrgChartNode> orgChart() {
        List<EmployeeResponse> employees = listEmployees(null, null, null, "ACTIVE", null, 0, 5000)
            .getItems();
        Map<UUID, EmployeeResponse> byId = new LinkedHashMap<>();
        for (EmployeeResponse employee : employees) {
            if (employee.id() != null) {
                byId.put(UUID.fromString(employee.id()), employee);
            }
        }
        LocalDate today = LocalDate.now();
        List<ReportingRelationship> edges = client.query("reporting.list_all", Map.of())
            .rows().stream()
            .map(ReportingRelationship::from)
            .filter(edge -> edge.validTo == null || !edge.validTo.isBefore(today))
            .toList();
        Map<UUID, List<UUID>> children = new LinkedHashMap<>();
        Set<UUID> subordinates = new HashSet<>();
        for (ReportingRelationship edge : edges) {
            if (edge.employeeId == null || edge.managerEmployeeId == null
                    || edge.employeeId.equals(edge.managerEmployeeId)
                    || !byId.containsKey(edge.employeeId) || !byId.containsKey(edge.managerEmployeeId)) {
                continue;
            }
            children.computeIfAbsent(edge.managerEmployeeId, key -> new ArrayList<>()).add(edge.employeeId);
            subordinates.add(edge.employeeId);
        }
        List<UUID> roots = byId.keySet().stream()
            .filter(id -> !subordinates.contains(id))
            .sorted(Comparator.comparing(id -> byId.get(id).employeeCode()))
            .toList();
        List<OrgChartNode> nodes = new ArrayList<>();
        Set<UUID> visited = new HashSet<>();
        for (UUID root : roots) {
            appendOrgNode(root, null, 0, byId, children, visited, nodes);
        }
        // A cycle-only component has no root; surface it once instead of hiding employees.
        for (UUID id : byId.keySet()) {
            if (!visited.contains(id)) {
                appendOrgNode(id, null, 0, byId, children, visited, nodes);
            }
        }
        return nodes;
    }

    private void appendOrgNode(UUID id, UUID managerId, int depth, Map<UUID, EmployeeResponse> byId,
                               Map<UUID, List<UUID>> children, Set<UUID> visited,
                               List<OrgChartNode> out) {
        if (id == null || visited.contains(id) || !byId.containsKey(id) || depth > 20) {
            return;
        }
        visited.add(id);
        EmployeeResponse employee = byId.get(id);
        out.add(new OrgChartNode(employee.id(), employee.employeeCode(), employee.fullName(),
            employee.status(), employee.employeeType(),
            managerId == null ? null : managerId.toString(), depth));
        List<UUID> childIds = new ArrayList<>(children.getOrDefault(id, List.of()));
        childIds.sort(Comparator.comparing(child -> byId.get(child).employeeCode()));
        for (UUID child : childIds) {
            appendOrgNode(child, id, depth + 1, byId, children, visited, out);
        }
    }

    // ----------------------------------------------------------------- documents

    public List<DocumentResponse> listDocuments(UUID employeeId) {
        requireEmployee(employeeId);
        return documentRows(employeeId).stream()
            .map(EmployeeDocument::from)
            .map(DocumentResponse::from)
            .toList();
    }

    public List<DocumentResponse> listSelfDocuments() {
        return listDocuments(requireSelfProfile().id);
    }

    public DocumentResponse createDocument(UUID employeeId, DocumentRequest request) {
        requireBody(request);
        requireEmployee(employeeId);
        String documentType = EmployeeValidation.requiredText(request.documentType(), "document_type", 64);
        String fileName = EmployeeValidation.requiredText(request.fileName(), "file_name", 255);
        String mimeType = EmployeeValidation.requiredText(request.mimeType(), "mime_type", 128);
        String storageKey = EmployeeValidation.requiredText(request.storageKey(), "storage_key", 2048);
        long sizeBytes = EmployeeValidation.documentSize(request.sizeBytes());

        int version = nextDocumentVersion(employeeId, documentType);

        Map<String, Object> params = new HashMap<>();
        params.put("employee_id", employeeId);
        params.put("document_type", documentType);
        params.put("version", version);
        params.put("storage_key", storageKey);
        params.put("file_name", fileName);
        params.put("mime_type", mimeType);
        params.put("size_bytes", sizeBytes);
        putText(params, "checksum", request.checksum());
        params.put("scan_status", "PENDING");
        putIfPresent(params, "uploaded_by", context.userId());
        params.put("upload_source", "HR");
        putIfPresent(params, "retention_until", request.retentionUntil());
        params.put("status", "ACTIVE");

        Map<String, Object> row = writeOne("document.insert", params);
        EmployeeDocument document = EmployeeDocument.from(row);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("document_id", document.id);
        payload.put("employee_id", employeeId);
        payload.put("storage_key", storageKey);
        emitOutbox("DOCUMENT_SCAN", document.id, payload);
        return DocumentResponse.from(document);
    }

    /** Multipart upload stored on the plugin-local filesystem. */
    public DocumentResponse uploadDocument(UUID employeeId, String documentType,
                                           String fileName, String mimeType,
                                           byte[] bytes, LocalDate retentionUntil) {
        return storeDocument(employeeId, documentType, fileName, mimeType, bytes, retentionUntil, "HR");
    }

    public DocumentResponse uploadSelfDocument(String documentType, String fileName,
                                               String mimeType, byte[] bytes) {
        return storeDocument(requireSelfProfile().id, documentType, fileName, mimeType,
            bytes, null, "EMPLOYEE");
    }

    private DocumentResponse storeDocument(UUID employeeId, String documentType,
                                           String fileName, String mimeType,
                                           byte[] bytes, LocalDate retentionUntil, String source) {
        requireEmployee(employeeId);
        String type = EmployeeValidation.requiredText(documentType, "document_type", 64);
        String name = EmployeeValidation.requiredText(fileName, "file_name", 255);
        String mime = EmployeeValidation.requiredText(mimeType, "mime_type", 128).toLowerCase();
        int parameters = mime.indexOf(';');
        if (parameters > 0) {
            mime = mime.substring(0, parameters).trim();
        }
        if (!DOCUMENT_MIME_TYPES.contains(mime)) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_DOCUMENT_TYPE_NOT_ALLOWED,
                "Document content type is not allowed", Map.of("mime_type", mime));
        }
        if (bytes == null || bytes.length == 0) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, "Document file is empty",
                Map.of("field", "file"));
        }
        if (bytes.length > documentMaxBytes) {
            throw new ApiException(413, EmployeeErrorCode.EMPLOYEE_DOCUMENT_TOO_LARGE,
                "Document exceeds the size limit", Map.of("max_bytes", documentMaxBytes));
        }
        UUID tenantId = requireTenant();
        Path base = documentStorageBase();
        String storageKey = tenantId + "/" + UUID.randomUUID() + documentExtension(name);
        Path target = base.resolve(storageKey).normalize();
        if (!target.startsWith(base)) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_DOCUMENT_STORAGE_FAILED,
                "Invalid document storage key", Map.of());
        }
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException e) {
            throw new ApiException(500, EmployeeErrorCode.EMPLOYEE_DOCUMENT_STORAGE_FAILED,
                "Cannot store the uploaded document", Map.of());
        }

        int version = nextDocumentVersion(employeeId, type);
        String scanStatus = "PENDING";
        String scan = scanWithClamAv(bytes);
        if ("INFECTED".equals(scan)) {
            try {
                Files.deleteIfExists(target);
            } catch (IOException ignored) {
                LOG.warnf("Cannot delete infected document %s", target);
            }
            throw new ApiException(422, EmployeeErrorCode.EMPLOYEE_DOCUMENT_INFECTED,
                "Document failed the virus scan", Map.of("field", "file"));
        }
        if ("CLEAN".equals(scan)) {
            scanStatus = "CLEAN";
        }
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("employee_id", employeeId);
            params.put("document_type", type);
            params.put("version", version);
            params.put("storage_key", storageKey);
            params.put("file_name", name);
            params.put("mime_type", mime);
            params.put("size_bytes", (long) bytes.length);
            params.put("checksum", sha256Hex(bytes));
            params.put("scan_status", scanStatus);
            putIfPresent(params, "uploaded_by", context.userId());
            params.put("upload_source", source);
            putIfPresent(params, "retention_until", retentionUntil);
            params.put("status", "ACTIVE");
            EmployeeDocument document = EmployeeDocument.from(
                writeOne("document.insert", params));

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("document_id", document.id);
            payload.put("employee_id", employeeId);
            payload.put("storage_key", storageKey);
            emitOutbox("DOCUMENT_SCAN", document.id, payload);
            return DocumentResponse.from(document);
        } catch (RuntimeException e) {
            try {
                Files.deleteIfExists(target);
            } catch (IOException ignored) {
                LOG.warnf("Cannot delete orphaned document file %s", target);
            }
            throw e;
        }
    }

    private String scanWithClamAv(byte[] bytes) {
        if (clamavHost == null || clamavHost.isBlank()) {
            return null;
        }
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(clamavHost.trim(), clamavPort), 1500);
            socket.setSoTimeout(15000);
            OutputStream out = socket.getOutputStream();
            out.write("zINSTREAM\0".getBytes(StandardCharsets.US_ASCII));
            int offset = 0;
            while (offset < bytes.length) {
                int length = Math.min(8192, bytes.length - offset);
                out.write(ByteBuffer.allocate(4).putInt(length).array());
                out.write(bytes, offset, length);
                offset += length;
            }
            out.write(new byte[]{0, 0, 0, 0});
            out.flush();
            String response = new String(socket.getInputStream().readAllBytes(), StandardCharsets.US_ASCII);
            if (response.contains("FOUND")) {
                return "INFECTED";
            }
            if (response.contains("OK")) {
                return "CLEAN";
            }
            LOG.warnf("ClamAV returned an unexpected response: %s", response.trim());
        } catch (IOException e) {
            LOG.warnf("ClamAV scan unavailable at %s:%s: %s", clamavHost, clamavPort, e.getMessage());
        }
        return null;
    }

    public StoredDocument downloadDocument(UUID id) {
        EmployeeDocument document = requireDocument(id);
        if ("INFECTED".equals(document.scanStatus) || "FAILED".equals(document.scanStatus)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_DOCUMENT_SCAN_FAILED,
                "Document is not available until the scan succeeds",
                Map.of("document_id", id.toString(), "scan_status", document.scanStatus));
        }
        Path base = documentStorageBase();
        Path file = base.resolve(document.storageKey).normalize();
        if (!file.startsWith(base) || !Files.isRegularFile(file)) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_DOCUMENT_FILE_NOT_FOUND,
                "Document file not found", Map.of("document_id", id.toString()));
        }
        return new StoredDocument(file.toFile(), document.fileName, document.mimeType);
    }

    public StoredDocument downloadSelfDocument(UUID id) {
        EmployeeDocument document = requireDocument(id);
        if (!requireSelfProfile().id.equals(document.employeeId)) {
            throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_DOCUMENT_FORBIDDEN,
                "Document does not belong to the current employee",
                Map.of("document_id", id.toString()));
        }
        return downloadDocument(id);
    }

    /**
     * TASK-433 signed URL: issues a short-lived pre-signed download link. The
     * signature is HMAC-SHA256 over {@code documentId + "." + expiryEpoch} with
     * the plugin secret, so the link stays tamper-proof and expires quickly.
     */
    public SignedUrlResponse createSignedUrl(UUID id, boolean self) {
        EmployeeDocument document = self ? downloadOwnershipCheck(id) : requireDocument(id);
        if ("INFECTED".equals(document.scanStatus) || "FAILED".equals(document.scanStatus)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_DOCUMENT_SCAN_FAILED,
                "Document is not available until the scan succeeds",
                Map.of("document_id", id.toString(), "scan_status", document.scanStatus));
        }
        long ttl = Math.max(30, signedUrlTtlSeconds);
        long expiry = Instant.now().plusSeconds(ttl).getEpochSecond();
        String signature = signedUrlSignature(id, expiry);
        String url = "/api/v1/employee/signed-documents/" + id
            + "?exp=" + expiry + "&sig=" + signature;
        return new SignedUrlResponse(id, url, Instant.ofEpochSecond(expiry));
    }

    /** Verifies a signed download link and streams the document when valid. */
    public StoredDocument downloadSignedDocument(UUID id, Long expiryEpoch, String signature) {
        if (expiryEpoch == null || signature == null || signature.isBlank()) {
            throw invalidSignedUrl();
        }
        Instant now = Instant.now();
        if (expiryEpoch <= now.getEpochSecond()
            || expiryEpoch > now.plusSeconds(Math.max(30, signedUrlTtlSeconds) + 5).getEpochSecond()) {
            throw invalidSignedUrl();
        }
        if (!MessageDigest.isEqual(
                signedUrlSignature(id, expiryEpoch).getBytes(StandardCharsets.US_ASCII),
                signature.getBytes(StandardCharsets.US_ASCII))) {
            throw invalidSignedUrl();
        }
        return downloadDocument(id);
    }

    private ApiException invalidSignedUrl() {
        return new ApiException(403, EmployeeErrorCode.EMPLOYEE_DOCUMENT_SIGNED_URL_INVALID,
            "Signed download link is invalid or expired", Map.of());
    }

    private String signedUrlSignature(UUID documentId, long expiryEpoch) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(
                signedUrlSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal((documentId + "." + expiryEpoch).getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new ApiException(500, EmployeeErrorCode.EMPLOYEE_DOCUMENT_STORAGE_FAILED,
                "Cannot sign the document download URL");
        }
    }

    private EmployeeDocument downloadOwnershipCheck(UUID id) {
        EmployeeDocument document = requireDocument(id);
        if (!requireSelfProfile().id.equals(document.employeeId)) {
            throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_DOCUMENT_FORBIDDEN,
                "Document does not belong to the current employee",
                Map.of("document_id", id.toString()));
        }
        return document;
    }

    public DocumentResponse updateScanResult(UUID id, ScanResultRequest request) {
        requireBody(request);
        requireDocument(id);
        String status = EmployeeValidation.scanStatus(request.status());
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("scan_status", status);
        params.put("updated_at", Instant.now());
        EmployeeDocument document = EmployeeDocument.from(writeOne("document.update_scan", params));
        if ("INFECTED".equals(status)) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("document_id", id);
            payload.put("employee_id", document.employeeId);
            payload.put("scan_status", status);
            putText(payload, "engine", request.engine());
            emitOutbox("NOTIFICATION", id, payload);
        }
        return DocumentResponse.from(document);
    }

    // ------------------------------------------------------------------- helpers

    private EmployeeProfile requireSelfProfile() {
        UUID userId = requireUser();
        Map<String, Object> row = firstRow(client.query("employee.get_by_user",
            Map.of("user_id", userId)));
        if (row == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_PROFILE_NOT_FOUND,
                "No employee profile is linked to the current user", Map.of());
        }
        return EmployeeProfile.from(row);
    }

    private Map<String, FieldConfig> fieldConfigMap() {
        Map<String, FieldConfig> configs = new HashMap<>();
        for (FieldConfig config : fieldConfigRows()) {
            configs.put(config.fieldKey, config);
        }
        return configs;
    }

    private List<EmployeeApprovalConfig> approvalConfigRows() {
        return client.query("approval_config.list", Map.of("page", 0, "size", 200)).rows().stream()
            .map(EmployeeApprovalConfig::from)
            .toList();
    }

    private static String approvalConfigKey(EmployeeApprovalConfig item) {
        return approvalConfigKey(item.scopeType, item.scopeId, item.fieldGroup, item.stepNo);
    }

    private static String approvalConfigKey(String scopeType, UUID scopeId,
                                            String fieldGroup, Integer stepNo) {
        return (scopeType == null ? "" : scopeType.trim().toUpperCase())
            + "|" + (scopeId == null ? "" : scopeId)
            + "|" + (fieldGroup == null ? "" : fieldGroup.trim().toUpperCase())
            + "|" + (stepNo == null ? "" : stepNo);
    }

    private EmployeeOnboardingInvite requireOnboardingInvite(UUID id) {
        UUID required = requireId(id, "onboarding_invite_id");
        Map<String, Object> row = firstRow(client.query("onboarding.get",
            Map.of("id", required)));
        if (row == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_ONBOARDING_INVITE_NOT_FOUND,
                "Onboarding invite not found", Map.of("onboarding_invite_id", required.toString()));
        }
        return EmployeeOnboardingInvite.from(row);
    }

    private static String newOnboardingToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String onboardingLink(String token) {
        String base = frontendUrl == null ? "" : frontendUrl.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/apps/employee/onboarding?token="
            + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private static String sha256Hex(String value) {
        return sha256Hex(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String sha256Hex(byte[] value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private EmployeeCampaign requireCampaign(UUID id) {
        UUID required = requireId(id, "campaign_id");
        Map<String, Object> row = firstRow(client.query("campaign.get", Map.of("id", required)));
        if (row == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_CAMPAIGN_NOT_FOUND,
                "Campaign not found", Map.of("campaign_id", required.toString()));
        }
        return EmployeeCampaign.from(row);
    }

    private List<UUID> filterEmployeeIds(Object raw) {
        if (raw == null) {
            return null;
        }
        if (!(raw instanceof List<?> list)) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                "filter.employee_ids must be an array", Map.of("field", "filter.employee_ids"));
        }
        List<UUID> ids = new ArrayList<>();
        for (Object item : list) {
            try {
                ids.add(UUID.fromString(String.valueOf(item)));
            } catch (IllegalArgumentException e) {
                throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                    "filter.employee_ids contains an invalid id",
                    Map.of("field", "filter.employee_ids"));
            }
        }
        return ids;
    }

    private List<UUID> resolveCampaignRecipients(List<UUID> explicitIds, String filterStatus) {
        LinkedHashSet<UUID> recipients = new LinkedHashSet<>();
        if (explicitIds != null && !explicitIds.isEmpty()) {
            if (explicitIds.size() > MAX_CAMPAIGN_RECIPIENTS) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_CAMPAIGN_RECIPIENT_LIMIT,
                    "Campaign recipient limit exceeded",
                    Map.of("max_recipients", MAX_CAMPAIGN_RECIPIENTS));
            }
            for (UUID employeeId : explicitIds) {
                requireEmployee(employeeId);
                recipients.add(employeeId);
            }
            return List.copyOf(recipients);
        }

        int page = 0;
        while (recipients.size() < MAX_CAMPAIGN_RECIPIENTS) {
            Map<String, Object> params = new HashMap<>();
            if ("ACTIVE".equals(filterStatus)) {
                params.put("status", "ACTIVE");
            }
            params.put("page", page);
            params.put("size", 100);
            PluginQueryResult result = client.query("employee.list", params);
            for (Map<String, Object> row : result.rows()) {
                recipients.add(EmployeeProfile.from(row).id);
                if (recipients.size() >= MAX_CAMPAIGN_RECIPIENTS) {
                    break;
                }
            }
            if (result.rows().size() < 100
                    || (long) (page + 1) * 100 >= result.totalRows()) {
                break;
            }
            page++;
        }
        if (recipients.isEmpty()) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_CAMPAIGN_NO_RECIPIENTS,
                "Campaign filter matched no employees", Map.of());
        }
        return List.copyOf(recipients);
    }

    private boolean hasPermission(String permission) {
        return context.platform() || context.permissions().contains(permission);
    }

    private boolean canManagePrivacy() {
        return hasPermission(PRIVACY_MANAGE_PERMISSION);
    }

    private EmployeePrivacyRequest requirePrivacyRequest(UUID id) {
        UUID required = requireId(id, "privacy_request_id");
        Map<String, Object> row = firstRow(client.query("privacy.get", Map.of("id", required)));
        if (row == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_PRIVACY_REQUEST_NOT_FOUND,
                "Privacy request not found", Map.of("privacy_request_id", required.toString()));
        }
        return EmployeePrivacyRequest.from(row);
    }

    private UUID resolveConsentEmployee(UUID employeeId, boolean write) {
        requireUser();
        boolean manager = canManagePrivacy();
        if (employeeId != null) {
            if (!manager) {
                throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_PRIVACY_FORBIDDEN,
                    "Privacy management permission is required", Map.of());
            }
            return requireEmployee(employeeId).id;
        }
        if (!manager && !hasPermission(write ? SELF_UPDATE_PERMISSION : SELF_READ_PERMISSION)) {
            throw new ApiException(403, EmployeeErrorCode.EMPLOYEE_PRIVACY_FORBIDDEN,
                "Self-service permission is required", Map.of());
        }
        return requireSelfProfile().id;
    }

    private EmployeeDocument requireDocument(UUID id) {
        UUID required = requireId(id, "document_id");
        Map<String, Object> row = firstRow(client.query("document.get", Map.of("id", required)));
        if (row == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_DOCUMENT_NOT_FOUND,
                "Document not found", Map.of("document_id", required.toString()));
        }
        return EmployeeDocument.from(row);
    }

    private int nextDocumentVersion(UUID employeeId, String documentType) {
        int version = 1;
        for (Map<String, Object> row : documentRows(employeeId)) {
            EmployeeDocument item = EmployeeDocument.from(row);
            if (documentType.equals(item.documentType) && item.version != null) {
                version = Math.max(version, item.version + 1);
            }
        }
        return version;
    }

    private Path documentStorageBase() {
        String configured = documentStorageDir == null || documentStorageDir.isEmpty()
            ? ""
            : documentStorageDir.get().trim();
        Path base = configured.isEmpty()
            ? Path.of(System.getProperty("java.io.tmpdir"), "open-erp-employee-documents")
            : Path.of(configured);
        return base.toAbsolutePath().normalize();
    }

    private UUID requireTenant() {
        UUID tenantId = context.tenantId();
        if (tenantId == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED,
                "Tenant context is required", Map.of());
        }
        return tenantId;
    }

    private static String documentExtension(String fileName) {
        String name = fileName == null ? "" : fileName.trim();
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) {
            return ".bin";
        }
        String extension = name.substring(dot).toLowerCase();
        return extension.matches("\\.[a-z0-9]{1,10}") ? extension : ".bin";
    }

    private EmployeeProfile requireEmployee(UUID id) {
        UUID required = requireId(id, "employee_id");
        Map<String, Object> row = firstRow(client.query("employee.get", Map.of("id", required)));
        if (row == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_NOT_FOUND,
                "Employee not found", Map.of("employee_id", required.toString()));
        }
        return EmployeeProfile.from(row);
    }

    private EmployeeChangeRequest requireChangeRequest(UUID id) {
        UUID required = requireId(id, "change_request_id");
        Map<String, Object> row = firstRow(client.query("change_request.get", Map.of("id", required)));
        if (row == null) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_NOT_FOUND,
                "Change request not found", Map.of("change_request_id", required.toString()));
        }
        return EmployeeChangeRequest.from(row);
    }

    private void ensureCodeAvailable(String code) {
        Map<String, Object> row = firstRow(client.query("employee.get_by_code", Map.of("employee_code", code)));
        if (row != null) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_CODE_EXISTS,
                "Employee code already exists", Map.of("employee_code", code));
        }
    }

    private void ensureUserAvailable(UUID userId, UUID excludeEmployeeId) {
        Map<String, Object> row = firstRow(client.query("employee.get_by_user", Map.of("user_id", userId)));
        if (row == null) {
            return;
        }
        EmployeeProfile linked = EmployeeProfile.from(row);
        if (excludeEmployeeId == null || !excludeEmployeeId.equals(linked.id)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_USER_ALREADY_LINKED,
                "User is already linked to an employee profile", Map.of("user_id", userId.toString()));
        }
    }

    private List<Map<String, Object>> assignmentRows(UUID employeeId) {
        return client.query("assignment.list", Map.of(
            "employee_id", employeeId,
            "page", 0,
            "size", 200)).rows();
    }

    private List<Map<String, Object>> changeRequestRows(UUID employeeId) {
        return client.query("change_request.list", Map.of(
            "employee_id", employeeId,
            "page", 0,
            "size", 100)).rows();
    }

    private List<ChangeRequestStep> stepRows(UUID requestId) {
        return client.query("change_request_step.list", Map.of(
            "request_id", requestId,
            "page", 0,
            "size", 200)).rows().stream()
            .map(ChangeRequestStep::from)
            .toList();
    }

    private List<FieldConfig> fieldConfigRows() {
        return client.query("field_config.list", Map.of("page", 0, "size", 200)).rows().stream()
            .map(FieldConfig::from)
            .toList();
    }

    private List<Map<String, Object>> documentRows(UUID employeeId) {
        return client.query("document.list", Map.of(
            "employee_id", employeeId,
            "page", 0,
            "size", 200)).rows();
    }

    private Map<String, Object> writeOne(String queryId, Map<String, Object> params) {
        PluginQueryResult result = client.write(queryId, params);
        Map<String, Object> row = firstRow(result);
        if (row == null) {
            throw new ApiException(500, EmployeeErrorCode.EMPLOYEE_WRITE_FAILED,
                "Employee data write returned no row", Map.of("query_id", queryId));
        }
        return row;
    }

    private void emitOutbox(String eventType, UUID aggregateId, Map<String, Object> payload) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("event_type", eventType);
            params.put("aggregate_id", aggregateId);
            params.put("payload", objectMapper.writeValueAsString(payload));
            params.put("status", "PENDING");
            params.put("retry_count", 0);
            params.put("next_retry_at", null);
            client.write("outbox.insert", params);
        } catch (JsonProcessingException e) {
            LOG.warnf("Cannot serialize %s outbox payload for %s: %s", eventType, aggregateId, e.getMessage());
        } catch (RuntimeException e) {
            LOG.warnf("Cannot write %s outbox event for %s: %s", eventType, aggregateId, e.getMessage());
        }
    }

    private void ensureManagerCycle(UUID employeeId, UUID managerId) {
        Set<UUID> seen = new HashSet<>();
        UUID cursor = managerId;
        while (cursor != null) {
            if (cursor.equals(employeeId)) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_ASSIGNMENT_MANAGER_CYCLE,
                    "Assignment manager relationship would create a cycle",
                    Map.of("employee_id", employeeId.toString()));
            }
            if (!seen.add(cursor)) {
                return;
            }
            cursor = currentManagerOf(cursor);
        }
    }

    private UUID currentManagerOf(UUID employeeId) {
        return assignmentRows(employeeId).stream()
            .map(EmployeeAssignment::from)
            .filter(item -> "ACTIVE".equals(item.status))
            .filter(item -> item.managerEmployeeId != null)
            .map(item -> item.managerEmployeeId)
            .findFirst()
            .orElse(null);
    }

    private static boolean overlaps(LocalDate from, LocalDate to, LocalDate otherFrom, LocalDate otherTo) {
        if (otherFrom == null) {
            return false;
        }
        LocalDate leftEnd = to == null ? LocalDate.MAX : to;
        LocalDate rightEnd = otherTo == null ? LocalDate.MAX : otherTo;
        return !from.isAfter(rightEnd) && !otherFrom.isAfter(leftEnd);
    }

    private ChangeRequestStep currentStep(EmployeeChangeRequest request, List<ChangeRequestStep> steps) {
        int expected = request.currentStep == null ? 1 : request.currentStep;
        ChangeRequestStep current = steps.stream()
            .filter(item -> item.stepNo != null && item.stepNo == expected)
            .findFirst()
            .orElseThrow(() -> new ApiException(409, EmployeeErrorCode.EMPLOYEE_APPROVAL_STEP_NOT_CURRENT,
                "Approval step is not the current step", Map.of("change_request_id", request.id.toString())));
        if (!"PENDING".equals(current.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_APPROVAL_STEP_NOT_CURRENT,
                "Approval step is not the current step", Map.of("change_request_id", request.id.toString()));
        }
        return current;
    }

    private void assertOpen(EmployeeChangeRequest request) {
        if (!"PENDING".equals(request.status) && !"IN_REVIEW".equals(request.status)) {
            throw new ApiException(409, EmployeeErrorCode.EMPLOYEE_CHANGE_REQUEST_INVALID_STATE,
                "Change request is not open", Map.of("change_request_id", String.valueOf(request.id)));
        }
    }

    /** Final approval applies the requested diff to the profile. */
    private void applyChangeRequest(EmployeeChangeRequest request) {
        Map<String, Object> changes = readJson(request.changesJson);
        if (changes.isEmpty()) {
            return;
        }
        Map<String, Object> params = new HashMap<>(changes);
        params.put("id", request.employeeId);
        params.put("updated_at", Instant.now());
        writeOne("employee.update", params);
    }

    private String changeStatusFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if (!CHANGE_STATUSES.contains(normalized)) {
            throw new ApiException(400, "VALIDATION_INVALID_STATUS",
                "status is not a valid change request status", Map.of("field", "status"));
        }
        return normalized;
    }

    private boolean canReadSensitive() {
        return context.platform() || context.permissions().contains(SENSITIVE_PERMISSION);
    }

    private UUID requireUser() {
        UUID userId = context.userId();
        if (userId == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED,
                "Authenticated user context is required", Map.of());
        }
        return userId;
    }

    private static UUID requireId(UUID value, String field) {
        if (value == null) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, field + " is required",
                Map.of("field", field));
        }
        return value;
    }

    private static void requireBody(Object body) {
        if (body == null) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, "Request body is required", Map.of());
        }
    }

    private static int pageSize(int size, int max, int fallback) {
        if (size <= 0) {
            return fallback;
        }
        return Math.min(size, max);
    }

    private static void putIfPresent(Map<String, Object> params, String key, Object value) {
        if (value != null) {
            params.put(key, value);
        }
    }

    private static void putText(Map<String, Object> params, String key, String value) {
        if (value != null && !value.isBlank()) {
            params.put(key, value.trim());
        }
    }

    private static Map<String, Object> firstRow(PluginQueryResult result) {
        return result.rows().isEmpty() ? null : result.rows().get(0);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                "Value cannot be serialized as JSON", Map.of());
        }
    }

    private Map<String, Object> readJson(String value) {
        if (value == null || value.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<Map<String, Object>>() { });
        } catch (JsonProcessingException e) {
            LOG.warnf("Cannot parse employee change payload: %s", e.getMessage());
            return Map.of();
        }
    }
}
