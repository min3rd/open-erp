package com.vn9melody.openerp.plugins.employee.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugins.employee.model.ChangeRequestStep;
import com.vn9melody.openerp.plugins.employee.model.EmployeeApprovalConfig;
import com.vn9melody.openerp.plugins.employee.model.EmployeeAssignment;
import com.vn9melody.openerp.plugins.employee.model.EmployeeCampaign;
import com.vn9melody.openerp.plugins.employee.model.EmployeeChangeRequest;
import com.vn9melody.openerp.plugins.employee.model.EmployeeConsent;
import com.vn9melody.openerp.plugins.employee.model.EmployeeDocument;
import com.vn9melody.openerp.plugins.employee.model.EmployeeContract;
import com.vn9melody.openerp.plugins.employee.model.EmployeeOnboardingInvite;
import com.vn9melody.openerp.plugins.employee.model.EmployeePrivacyRequest;
import com.vn9melody.openerp.plugins.employee.model.EmployeeProfile;
import com.vn9melody.openerp.plugins.employee.model.ReportingRelationship;
import com.vn9melody.openerp.plugins.employee.model.Rows;
import com.vn9melody.openerp.plugins.employee.model.FieldConfig;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class EmployeeDtos {

    private EmployeeDtos() {
    }

    public record EmployeeResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_code") String employeeCode,
        @JsonProperty("user_id") String userId,
        @JsonProperty("status") String status,
        @JsonProperty("employee_type") String employeeType,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("photo_url") String photoUrl,
        @JsonProperty("date_of_birth") LocalDate dateOfBirth,
        @JsonProperty("gender") String gender,
        @JsonProperty("nationality") String nationality,
        @JsonProperty("marital_status") String maritalStatus,
        @JsonProperty("national_id") String nationalId,
        @JsonProperty("tax_code") String taxCode,
        @JsonProperty("social_insurance_no") String socialInsuranceNo,
        @JsonProperty("health_insurance_no") String healthInsuranceNo,
        @JsonProperty("personal_email") String personalEmail,
        @JsonProperty("work_email") String workEmail,
        @JsonProperty("phone") String phone,
        @JsonProperty("current_address") String currentAddress,
        @JsonProperty("permanent_address") String permanentAddress,
        @JsonProperty("emergency_contact_name") String emergencyContactName,
        @JsonProperty("emergency_contact_relationship") String emergencyContactRelationship,
        @JsonProperty("emergency_contact_phone") String emergencyContactPhone,
        @JsonProperty("education_level") String educationLevel,
        @JsonProperty("school") String school,
        @JsonProperty("major") String major,
        @JsonProperty("graduation_year") Integer graduationYear,
        @JsonProperty("notes") String notes,
        @JsonProperty("scope_sync_status") String scopeSyncStatus,
        @JsonProperty("exit_date") LocalDate exitDate,
        @JsonProperty("exit_reason") String exitReason,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("updated_at") Instant updatedAt,
        @JsonProperty("archived_at") Instant archivedAt,
        @JsonProperty("version") Long version
    ) {
        public static EmployeeResponse from(EmployeeProfile item, boolean sensitive) {
            return new EmployeeResponse(
                asId(item.id), item.employeeCode, asId(item.userId), item.status, item.employeeType,
                item.fullName, item.photoUrl, item.dateOfBirth, item.gender, item.nationality,
                item.maritalStatus,
                sensitive ? item.nationalId : null,
                sensitive ? item.taxCode : null,
                sensitive ? item.socialInsuranceNo : null,
                sensitive ? item.healthInsuranceNo : null,
                item.personalEmail, item.workEmail, item.phone,
                item.currentAddress, item.permanentAddress,
                item.emergencyContactName, item.emergencyContactRelationship, item.emergencyContactPhone,
                item.educationLevel, item.school, item.major, item.graduationYear, item.notes,
                item.scopeSyncStatus, item.exitDate, item.exitReason, item.createdAt, item.updatedAt, item.archivedAt, item.version);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EmployeeRequest(
        @JsonProperty("employee_code") String employeeCode,
        @JsonProperty("user_id") UUID userId,
        @JsonProperty("status") String status,
        @JsonProperty("employee_type") String employeeType,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("photo_url") String photoUrl,
        @JsonProperty("date_of_birth") LocalDate dateOfBirth,
        @JsonProperty("gender") String gender,
        @JsonProperty("nationality") String nationality,
        @JsonProperty("marital_status") String maritalStatus,
        @JsonProperty("national_id") String nationalId,
        @JsonProperty("tax_code") String taxCode,
        @JsonProperty("social_insurance_no") String socialInsuranceNo,
        @JsonProperty("health_insurance_no") String healthInsuranceNo,
        @JsonProperty("personal_email") String personalEmail,
        @JsonProperty("work_email") String workEmail,
        @JsonProperty("phone") String phone,
        @JsonProperty("current_address") String currentAddress,
        @JsonProperty("permanent_address") String permanentAddress,
        @JsonProperty("emergency_contact_name") String emergencyContactName,
        @JsonProperty("emergency_contact_relationship") String emergencyContactRelationship,
        @JsonProperty("emergency_contact_phone") String emergencyContactPhone,
        @JsonProperty("education_level") String educationLevel,
        @JsonProperty("school") String school,
        @JsonProperty("major") String major,
        @JsonProperty("graduation_year") Integer graduationYear,
        @JsonProperty("notes") String notes
    ) {
    }

    public record AssignmentRequest(
        @JsonProperty("branch_id") UUID branchId,
        @JsonProperty("department_id") UUID departmentId,
        @JsonProperty("job_title") String jobTitle,
        @JsonProperty("job_title_catalog_id") UUID jobTitleCatalogId,
        @JsonProperty("manager_employee_id") UUID managerEmployeeId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("valid_from") LocalDate validFrom,
        @JsonProperty("valid_to") LocalDate validTo,
        @JsonProperty("status") String status
    ) {
    }

    public record AssignmentResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("branch_id") String branchId,
        @JsonProperty("department_id") String departmentId,
        @JsonProperty("job_title") String jobTitle,
        @JsonProperty("job_title_catalog_id") String jobTitleCatalogId,
        @JsonProperty("manager_employee_id") String managerEmployeeId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("valid_from") LocalDate validFrom,
        @JsonProperty("valid_to") LocalDate validTo,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static AssignmentResponse from(EmployeeAssignment item) {
            return new AssignmentResponse(
                asId(item.id), asId(item.employeeId), asId(item.branchId), asId(item.departmentId),
                item.jobTitle, asId(item.jobTitleCatalogId), asId(item.managerEmployeeId),
                item.isPrimary, item.validFrom, item.validTo, item.status, item.createdAt);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ChangeRequestCreateRequest(
        @JsonProperty("employee_id") UUID employeeId,
        @JsonProperty("changes") Map<String, Object> changes
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OffboardRequest(
        @JsonProperty("exit_date") LocalDate exitDate,
        @JsonProperty("exit_reason") String exitReason
    ) {
    }

    public record LinkUserRequest(
        @JsonProperty("user_id") UUID userId
    ) {
    }

    public record ContractResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("contract_type") String contractType,
        @JsonProperty("contract_no") String contractNo,
        @JsonProperty("start_date") LocalDate startDate,
        @JsonProperty("end_date") LocalDate endDate,
        @JsonProperty("status") String status,
        @JsonProperty("document_id") String documentId,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static ContractResponse from(EmployeeContract item) {
            return new ContractResponse(
                item.id == null ? null : item.id.toString(),
                item.employeeId == null ? null : item.employeeId.toString(),
                item.contractType, item.contractNo, item.startDate, item.endDate,
                item.status, item.documentId == null ? null : item.documentId.toString(),
                item.createdAt);
        }
    }

    public record ContractRequest(
        @JsonProperty("contract_type") String contractType,
        @JsonProperty("contract_no") String contractNo,
        @JsonProperty("start_date") LocalDate startDate,
        @JsonProperty("end_date") LocalDate endDate,
        @JsonProperty("status") String status,
        @JsonProperty("document_id") UUID documentId
    ) {
    }

    public record ReportingResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("manager_employee_id") String managerEmployeeId,
        @JsonProperty("relationship_type") String relationshipType,
        @JsonProperty("valid_from") LocalDate validFrom,
        @JsonProperty("valid_to") LocalDate validTo,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static ReportingResponse from(ReportingRelationship item) {
            return new ReportingResponse(
                item.id == null ? null : item.id.toString(),
                item.employeeId == null ? null : item.employeeId.toString(),
                item.managerEmployeeId == null ? null : item.managerEmployeeId.toString(),
                item.relationshipType, item.validFrom, item.validTo, item.createdAt);
        }
    }

    public record ReportingRequest(
        @JsonProperty("manager_employee_id") UUID managerEmployeeId,
        @JsonProperty("relationship_type") String relationshipType,
        @JsonProperty("valid_from") LocalDate validFrom,
        @JsonProperty("valid_to") LocalDate validTo
    ) {
    }

    public record ApprovalRequest(
        @JsonProperty("comment") String comment
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RejectionRequest(
        @JsonProperty("reason") String reason
    ) {
    }

    public record ChangeRequestStepResponse(
        @JsonProperty("id") String id,
        @JsonProperty("request_id") String requestId,
        @JsonProperty("step_no") Integer stepNo,
        @JsonProperty("approver_type") String approverType,
        @JsonProperty("approver_id") String approverId,
        @JsonProperty("status") String status,
        @JsonProperty("acted_by") String actedBy,
        @JsonProperty("acted_at") Instant actedAt,
        @JsonProperty("comment") String comment,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static ChangeRequestStepResponse from(ChangeRequestStep item) {
            return new ChangeRequestStepResponse(
                asId(item.id), asId(item.requestId), item.stepNo, item.approverType,
                asId(item.approverId), item.status, asId(item.actedBy), item.actedAt,
                item.comment, item.createdAt);
        }
    }

    public record ChangeRequestResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("requested_by_user_id") String requestedByUserId,
        @JsonProperty("status") String status,
        @JsonProperty("current_step") Integer currentStep,
        @JsonProperty("changes") Map<String, Object> changes,
        @JsonProperty("submitted_at") Instant submittedAt,
        @JsonProperty("reviewed_at") Instant reviewedAt,
        @JsonProperty("rejection_reason") String rejectionReason,
        @JsonProperty("version") Long version,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("steps") List<ChangeRequestStepResponse> steps
    ) {
        public static ChangeRequestResponse from(EmployeeChangeRequest item, Map<String, Object> changes,
                                                 List<ChangeRequestStepResponse> steps) {
            return new ChangeRequestResponse(
                asId(item.id), asId(item.employeeId), asId(item.requestedByUserId), item.status,
                item.currentStep, changes, item.submittedAt, item.reviewedAt,
                item.rejectionReason, item.version, item.createdAt, steps);
        }
    }

    public record FieldConfigResponse(
        @JsonProperty("field_key") String fieldKey,
        @JsonProperty("editable_by_employee") Boolean editableByEmployee,
        @JsonProperty("requires_approval") Boolean requiresApproval,
        @JsonProperty("sort_order") Integer sortOrder,
        @JsonProperty("updated_by") String updatedBy,
        @JsonProperty("updated_at") Instant updatedAt
    ) {
        public static FieldConfigResponse from(FieldConfig item) {
            return new FieldConfigResponse(
                item.fieldKey, item.editableByEmployee, item.requiresApproval,
                item.sortOrder, asId(item.updatedBy), item.updatedAt);
        }
    }

    public record FieldConfigUpdateRequest(
        @JsonProperty("field_key") String fieldKey,
        @JsonProperty("editable_by_employee") Boolean editableByEmployee,
        @JsonProperty("requires_approval") Boolean requiresApproval,
        @JsonProperty("sort_order") Integer sortOrder
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DocumentRequest(
        @JsonProperty("document_type") String documentType,
        @JsonProperty("file_name") String fileName,
        @JsonProperty("mime_type") String mimeType,
        @JsonProperty("size_bytes") Long sizeBytes,
        @JsonProperty("checksum") String checksum,
        @JsonProperty("storage_key") String storageKey,
        @JsonProperty("retention_until") LocalDate retentionUntil
    ) {
    }

    public record DocumentResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("document_type") String documentType,
        @JsonProperty("version") Integer version,
        @JsonProperty("storage_key") String storageKey,
        @JsonProperty("file_name") String fileName,
        @JsonProperty("mime_type") String mimeType,
        @JsonProperty("size_bytes") Long sizeBytes,
        @JsonProperty("checksum") String checksum,
        @JsonProperty("scan_status") String scanStatus,
        @JsonProperty("uploaded_by") String uploadedBy,
        @JsonProperty("upload_source") String uploadSource,
        @JsonProperty("retention_until") LocalDate retentionUntil,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static DocumentResponse from(EmployeeDocument item) {
            return new DocumentResponse(
                asId(item.id), asId(item.employeeId), item.documentType, item.version,
                item.storageKey, item.fileName, item.mimeType, item.sizeBytes,
                item.checksum, item.scanStatus, asId(item.uploadedBy), item.uploadSource,
                item.retentionUntil, item.status, item.createdAt);
        }
    }

    public record OrgChartNode(
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("employee_code") String employeeCode,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("status") String status,
        @JsonProperty("employee_type") String employeeType,
        @JsonProperty("manager_employee_id") String managerEmployeeId,
        @JsonProperty("depth") int depth
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportRequest(
        @JsonProperty("dry_run") boolean dryRun,
        @JsonProperty("rows") List<EmployeeRequest> rows
    ) {
    }

    public record ImportError(
        @JsonProperty("row") int row,
        @JsonProperty("code") String code,
        @JsonProperty("field") String field,
        @JsonProperty("params") Map<String, Object> params
    ) {
    }

    public record ImportResult(
        @JsonProperty("dry_run") boolean dryRun,
        @JsonProperty("imported") int imported,
        @JsonProperty("errors") List<ImportError> errors
    ) {
    }

    public record DirectoryResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_code") String employeeCode,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("photo_url") String photoUrl,
        @JsonProperty("work_email") String workEmail,
        @JsonProperty("phone") String phone,
        @JsonProperty("employee_type") String employeeType,
        @JsonProperty("status") String status
    ) {
        public static DirectoryResponse from(EmployeeProfile item) {
            return new DirectoryResponse(
                asId(item.id), item.employeeCode, item.fullName, item.photoUrl,
                item.workEmail, item.phone, item.employeeType, item.status);
        }
    }

    public record BootstrapResult(
        @JsonProperty("seeded") int seeded,
        @JsonProperty("total") int total
    ) {
    }

    // ------------------------------------------------------- approval config

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ApprovalConfigRequest(
        @JsonProperty("id") UUID id,
        @JsonProperty("scope_type") String scopeType,
        @JsonProperty("scope_id") UUID scopeId,
        @JsonProperty("field_group") String fieldGroup,
        @JsonProperty("step_no") Integer stepNo,
        @JsonProperty("approver_type") String approverType,
        @JsonProperty("approver_id") UUID approverId
    ) {
    }

    public record ApprovalConfigResponse(
        @JsonProperty("id") String id,
        @JsonProperty("scope_type") String scopeType,
        @JsonProperty("scope_id") String scopeId,
        @JsonProperty("field_group") String fieldGroup,
        @JsonProperty("step_no") Integer stepNo,
        @JsonProperty("approver_type") String approverType,
        @JsonProperty("approver_id") String approverId,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static ApprovalConfigResponse from(EmployeeApprovalConfig item) {
            return new ApprovalConfigResponse(
                asId(item.id), item.scopeType, asId(item.scopeId), item.fieldGroup,
                item.stepNo, item.approverType, asId(item.approverId), item.createdAt);
        }
    }

    // ------------------------------------------------------------ onboarding

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OnboardingInviteRequest(
        @JsonProperty("email") String email,
        @JsonProperty("employee_id") UUID employeeId,
        @JsonProperty("expires_in_hours") Integer expiresInHours
    ) {
    }

    public record OnboardingInviteResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("email") String email,
        @JsonProperty("status") String status,
        @JsonProperty("expires_at") Instant expiresAt,
        @JsonProperty("submitted_at") Instant submittedAt,
        @JsonProperty("created_by") String createdBy,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("token") String token,
        @JsonProperty("link") String link,
        @JsonProperty("in_app_notified") boolean inAppNotified,
        @JsonProperty("notify_reason") String notifyReason
    ) {
        public static OnboardingInviteResponse from(EmployeeOnboardingInvite item,
                                                    String token, String link) {
            return from(item, token, link, false, null);
        }

        public static OnboardingInviteResponse from(EmployeeOnboardingInvite item,
                                                    String token, String link,
                                                    boolean inAppNotified, String notifyReason) {
            return new OnboardingInviteResponse(
                asId(item.id), asId(item.employeeId), item.email, item.status,
                item.expiresAt, item.submittedAt, asId(item.createdBy), item.createdAt,
                token, link, inAppNotified, notifyReason);
        }
    }

    public record OnboardingSubmitResponse(
        @JsonProperty("id") String id,
        @JsonProperty("status") String status,
        @JsonProperty("submitted_at") Instant submittedAt
    ) {
    }

    // --------------------------------------------------------------- campaign

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CampaignCreateRequest(
        @JsonProperty("name") String name,
        @JsonProperty("filter") Map<String, Object> filter,
        @JsonProperty("employee_ids") List<UUID> employeeIds,
        @JsonProperty("deadline") LocalDate deadline,
        @JsonProperty("status") String status
    ) {
    }

    public record CampaignResponse(
        @JsonProperty("id") String id,
        @JsonProperty("name") String name,
        @JsonProperty("filter") Map<String, Object> filter,
        @JsonProperty("deadline") LocalDate deadline,
        @JsonProperty("status") String status,
        @JsonProperty("created_by") String createdBy,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static CampaignResponse from(EmployeeCampaign item, Map<String, Object> filter) {
            return new CampaignResponse(
                asId(item.id), item.name, filter, item.deadline, item.status,
                asId(item.createdBy), item.createdAt);
        }
    }

    public record CampaignRecipientResponse(
        @JsonProperty("campaign_id") String campaignId,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("status") String status,
        @JsonProperty("completed_at") Instant completedAt
    ) {
        public static CampaignRecipientResponse from(CampaignRecipient item) {
            return new CampaignRecipientResponse(item.campaignId, item.employeeId,
                item.status, item.completedAt);
        }
    }

    /** Read model for a campaign recipient row. */
    public record CampaignRecipient(String campaignId, String employeeId, String status,
                                    Instant completedAt) {
        public static CampaignRecipient from(Map<String, Object> row) {
            return new CampaignRecipient(
                asId(Rows.uuid(row.get("campaign_id"))),
                asId(Rows.uuid(row.get("employee_id"))),
                Rows.text(row.get("status")),
                Rows.instant(row.get("completed_at")));
        }
    }

    // ---------------------------------------------------------------- privacy

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PrivacyRequestCreateRequest(
        @JsonProperty("employee_id") UUID employeeId,
        @JsonProperty("subject_user_id") UUID subjectUserId,
        @JsonProperty("request_type") String requestType,
        @JsonProperty("payload") Map<String, Object> payload,
        @JsonProperty("due_at") Instant dueAt
    ) {
    }

    public record PrivacyRequestResponse(
        @JsonProperty("id") String id,
        @JsonProperty("subject_user_id") String subjectUserId,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("request_type") String requestType,
        @JsonProperty("status") String status,
        @JsonProperty("payload") Map<String, Object> payload,
        @JsonProperty("due_at") Instant dueAt,
        @JsonProperty("completed_at") Instant completedAt,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static PrivacyRequestResponse from(EmployeePrivacyRequest item,
                                                  Map<String, Object> payload) {
            return new PrivacyRequestResponse(
                asId(item.id), asId(item.subjectUserId), asId(item.employeeId),
                item.requestType, item.status, payload, item.dueAt, item.completedAt,
                item.createdAt);
        }
    }

    public record PrivacyExportResponse(
        @JsonProperty("request") PrivacyRequestResponse request,
        @JsonProperty("employee") EmployeeResponse employee,
        @JsonProperty("assignments") List<AssignmentResponse> assignments,
        @JsonProperty("contracts") List<ContractResponse> contracts,
        @JsonProperty("documents") List<DocumentResponse> documents,
        @JsonProperty("consents") List<ConsentResponse> consents,
        @JsonProperty("generated_at") Instant generatedAt
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ConsentRequest(
        @JsonProperty("employee_id") UUID employeeId,
        @JsonProperty("purpose") String purpose,
        @JsonProperty("status") String status
    ) {
    }

    public record ConsentResponse(
        @JsonProperty("id") String id,
        @JsonProperty("employee_id") String employeeId,
        @JsonProperty("purpose") String purpose,
        @JsonProperty("status") String status,
        @JsonProperty("granted_at") Instant grantedAt,
        @JsonProperty("revoked_at") Instant revokedAt,
        @JsonProperty("source") String source,
        @JsonProperty("created_at") Instant createdAt
    ) {
        public static ConsentResponse from(EmployeeConsent item) {
            return new ConsentResponse(
                asId(item.id), asId(item.employeeId), item.purpose, item.status,
                item.grantedAt, item.revokedAt, item.source, item.createdAt);
        }
    }

    // -------------------------------------------------------------- documents

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScanResultRequest(
        @JsonProperty("status") String status,
        @JsonProperty("engine") String engine,
        @JsonProperty("scanned_at") Instant scannedAt
    ) {
    }

    /** Short-lived pre-signed download URL (TASK-433 signed URL). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SignedUrlResponse(
        @JsonProperty("document_id") UUID documentId,
        @JsonProperty("url") String url,
        @JsonProperty("expires_at") Instant expiresAt
    ) {
    }

    private static String asId(UUID value) {
        return value == null ? null : value.toString();
    }
}
