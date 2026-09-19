package com.vn9melody.openerp.modules.core.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.modules.core.model.CoreSampleRecord;
import java.math.BigDecimal;

/**
 * Fixed response DTO for the reference entity (TASK-284). Keys mirror the
 * shared frontend model {@code SampleRecord} and the backend {@code ResponseKey} enum.
 */
public class SampleRecordResponse {

    @JsonProperty("id")
    public String id;

    @JsonProperty("title")
    public String title;

    @JsonProperty("amount")
    public BigDecimal amount;

    @JsonProperty("status")
    public String status;

    @JsonProperty("branch_id")
    public String branchId;

    @JsonProperty("branch_name")
    public String branchName;

    @JsonProperty("department_id")
    public String departmentId;

    @JsonProperty("department_name")
    public String departmentName;

    @JsonProperty("assignee_id")
    public String assigneeId;

    @JsonProperty("assignee_name")
    public String assigneeName;

    @JsonProperty("created_by")
    public String createdBy;

    @JsonProperty("created_at")
    public String createdAt;

    @JsonProperty("updated_at")
    public String updatedAt;

    public SampleRecordResponse() {
    }

    public static SampleRecordResponse from(CoreSampleRecord record, String branchName, String departmentName,
                                            String assigneeName) {
        SampleRecordResponse response = new SampleRecordResponse();
        response.id = record.id != null ? record.id.toString() : null;
        response.title = record.title;
        response.amount = record.amount;
        response.status = record.status;
        response.branchId = record.branchId != null ? record.branchId.toString() : null;
        response.branchName = branchName;
        response.departmentId = record.departmentId != null ? record.departmentId.toString() : null;
        response.departmentName = departmentName;
        response.assigneeId = record.assigneeId != null ? record.assigneeId.toString() : null;
        response.assigneeName = assigneeName;
        response.createdBy = record.createdBy != null ? record.createdBy.toString() : null;
        response.createdAt = record.createdAt != null ? record.createdAt.toString() : null;
        response.updatedAt = record.updatedAt != null ? record.updatedAt.toString() : null;
        return response;
    }
}
