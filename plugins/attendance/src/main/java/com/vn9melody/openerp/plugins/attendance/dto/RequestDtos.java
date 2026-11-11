package com.vn9melody.openerp.plugins.attendance.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugins.attendance.model.ApprovalMode;
import com.vn9melody.openerp.plugins.attendance.model.MappingStatus;
import com.vn9melody.openerp.plugins.attendance.model.RequestStatus;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public final class RequestDtos {

    private RequestDtos() {}

    public record RequestTypeDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("code") String code,
            @JsonProperty("name") String name,
            @JsonProperty("is_system") boolean isSystem,
            @JsonProperty("is_active") boolean isActive,
            @JsonProperty("form_ref") Map<String, Object> formRef,
            @JsonProperty("workflow_definition_key") String workflowDefinitionKey,
            @JsonProperty("status_mapping") Map<String, Object> statusMapping,
            @JsonProperty("window_days") int windowDays,
            @JsonProperty("sort_order") int sortOrder,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record RequestTypeCreateRequest(
            @JsonProperty("code") String code,
            @JsonProperty("name") String name,
            @JsonProperty("form_ref") Map<String, Object> formRef,
            @JsonProperty("workflow_definition_key") String workflowDefinitionKey,
            @JsonProperty("window_days") Integer windowDays,
            @JsonProperty("sort_order") Integer sortOrder
    ) {}

    public record RequestTypeUpdateRequest(
            @JsonProperty("name") String name,
            @JsonProperty("is_active") Boolean isActive,
            @JsonProperty("form_ref") Map<String, Object> formRef,
            @JsonProperty("workflow_definition_key") String workflowDefinitionKey,
            @JsonProperty("window_days") Integer windowDays,
            @JsonProperty("sort_order") Integer sortOrder
    ) {}

    public record RequestSubmitRequest(
            @JsonProperty("request_type_code") String requestTypeCode,
            @JsonProperty("response") Map<String, Object> response,
            @JsonProperty("affected_window") Map<String, Object> affectedWindow
    ) {}

    public record RequestDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("code") String code,
            @JsonProperty("request_type_id") UUID requestTypeId,
            @JsonProperty("request_type_code") String requestTypeCode,
            @JsonProperty("request_type_name") String requestTypeName,
            @JsonProperty("subject_employee_id") UUID subjectEmployeeId,
            @JsonProperty("subject_employee_name") String subjectEmployeeName,
            @JsonProperty("submitted_by_user_id") UUID submittedByUserId,
            @JsonProperty("form_version") Integer formVersion,
            @JsonProperty("response") Map<String, Object> response,
            @JsonProperty("status") RequestStatus status,
            @JsonProperty("workflow_instance_id") UUID workflowInstanceId,
            @JsonProperty("approval_mode") ApprovalMode approvalMode,
            @JsonProperty("fallback_approver_employee_id") UUID fallbackApproverEmployeeId,
            @JsonProperty("fallback_comment") String fallbackComment,
            @JsonProperty("affected_window") Map<String, Object> affectedWindow,
            @JsonProperty("mapping_status") MappingStatus mappingStatus,
            @JsonProperty("mapping_error") String mappingError,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record FallbackActionRequest(
            @JsonProperty("action") RequestStatus action,
            @JsonProperty("comment") String comment
    ) {}

    public record WorkflowEventPayload(
            @JsonProperty("event") String event,
            @JsonProperty("source") String source,
            @JsonProperty("instance_id") UUID instanceId,
            @JsonProperty("definition_key") String definitionKey,
            @JsonProperty("business_key") String businessKey,
            @JsonProperty("outcome") String outcome,
            @JsonProperty("comment") String comment,
            @JsonProperty("variables") Map<String, Object> variables
    ) {}
}

